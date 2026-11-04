import { BadRequestException } from '@nestjs/common';
import { ActivityOutcome } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type {
  CatalogImportRequest,
  CatalogImportStrategy,
  ImportOutcome,
} from '../entities/catalog-import.js';
import { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import { emptyOutcome } from '../import/import-issues.js';
import { CatalogImportService } from './catalog-import.service.js';
import type { ImportJobsService } from './import-jobs.service.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';

const WORKSPACE_ID = 'ws-1';
const JOB_ID = 'job-1';
const ACTOR = Actor.user('user-1');
const OUTCOME: ImportOutcome = { ...emptyOutcome(), updatedVariants: 3, productIds: ['p-1'] };
const UNKNOWN_SKU = { code: ImportIssueCode.UnknownSku, message: 'unknown', sku: 'X', row: 2 };

function request(overrides: Partial<CatalogImportRequest> = {}): CatalogImportRequest {
  return {
    mode: CatalogImportMode.Inventory,
    format: CatalogImportFormat.InventoryCsv,
    fileName: 'stock.csv',
    content: Buffer.from('sku,available'),
    actor: ACTOR,
    ...overrides,
  };
}

function setup() {
  const run = vi.fn<CatalogImportStrategy['run']>().mockResolvedValue(OUTCOME);
  const strategy: CatalogImportStrategy = {
    mode: CatalogImportMode.Inventory,
    supports: (format) => format === CatalogImportFormat.InventoryCsv,
    run,
  };
  const jobs = {
    start: vi.fn<ImportJobsService['start']>().mockResolvedValue(JOB_ID),
    complete: vi.fn<ImportJobsService['complete']>().mockResolvedValue(),
    fail: vi.fn<ImportJobsService['fail']>().mockResolvedValue(),
  };
  const activity = new InMemoryActivityRecorder();
  const events = new CatalogEventBus();
  const service = new CatalogImportService(
    [strategy],
    jobs as unknown as ImportJobsService,
    activity,
    events,
  );
  return {
    events,
    productsChanged: vi.spyOn(events, 'productsChanged'),
    stockChanged: vi.spyOn(events, 'stockChanged'),
    service,
    jobs,
    run,
    activity,
  };
}

describe('CatalogImportService', () => {
  it('runs the mode, records the job and returns its id', async () => {
    const { service, jobs, run } = setup();

    const result = await service.importFile(WORKSPACE_ID, request());

    const { productIds: _productIds, ...counts } = OUTCOME;
    expect(result).toEqual({ ...counts, jobId: JOB_ID, mode: CatalogImportMode.Inventory });
    expect(jobs.start).toHaveBeenCalledWith(WORKSPACE_ID, {
      mode: CatalogImportMode.Inventory,
      format: CatalogImportFormat.InventoryCsv,
      fileName: 'stock.csv',
      actor: ACTOR,
    });
    expect(run).toHaveBeenCalledWith(WORKSPACE_ID, request());
    expect(jobs.complete).toHaveBeenCalledWith(WORKSPACE_ID, JOB_ID, OUTCOME);
  });

  it('records a rejected file as a failed job and a failed import, then rethrows', async () => {
    const { service, jobs, run, activity } = setup();
    const rejection = new BadRequestException('The file is not a readable CSV');
    run.mockRejectedValue(rejection);

    await expect(service.importFile(WORKSPACE_ID, request())).rejects.toBe(rejection);

    expect(jobs.fail).toHaveBeenCalledWith(WORKSPACE_ID, JOB_ID, rejection);
    expect(jobs.complete).not.toHaveBeenCalled();
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.StockImported,
      outcome: ActivityOutcome.FAILED,
      failureReason: 'The file is not a readable CSV',
      subject: { type: ActivitySubjectType.ImportJob, id: JOB_ID, label: 'stock.csv' },
    });
  });

  it('refuses a mode it has no strategy for, or a format the mode cannot read, without a job', async () => {
    const { service, jobs, activity } = setup();

    await expect(
      service.importFile(WORKSPACE_ID, request({ format: CatalogImportFormat.ShopifyCsv })),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.importFile(WORKSPACE_ID, request({ mode: CatalogImportMode.Create })),
    ).rejects.toThrow(BadRequestException);
    expect(jobs.start).not.toHaveBeenCalled();
    expect(activity.recorded).toEqual([]);
  });

  it('logs the import with its file, counts and the products it touched', async () => {
    const { service, run, activity } = setup();
    run.mockResolvedValue({ ...OUTCOME, failed: [UNKNOWN_SKU] });

    await service.importFile(WORKSPACE_ID, request());

    expect(activity.recorded[0]).toEqual({
      workspaceId: WORKSPACE_ID,
      actor: ACTOR,
      entry: {
        action: ActivityAction.StockImported,
        subject: { type: ActivitySubjectType.ImportJob, id: JOB_ID, label: 'stock.csv' },
        relatedSubjectIds: ['p-1'],
        itemCount: 3,
        detail: '1 failed',
      },
    });
    expect(activity.entries[0]?.outcome).toBeUndefined();
  });

  it('counts an import that rejected every record as failed', async () => {
    const { service, run, activity } = setup();
    run.mockResolvedValue({ ...emptyOutcome(), failed: [UNKNOWN_SKU] });

    await service.importFile(WORKSPACE_ID, request());

    expect(activity.entries[0]).toMatchObject({
      outcome: ActivityOutcome.FAILED,
      failureReason: 'No stock level in the file could be set',
    });
  });
});
