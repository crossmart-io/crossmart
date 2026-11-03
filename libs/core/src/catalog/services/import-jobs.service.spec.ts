import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ImportIssueOutcome, ImportJobStatus } from '@crossmart/database';
import { UNEXPECTED_FAILURE_REASON } from '../../activity/activity.constants.js';
import { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import { emptyOutcome } from '../import/import-issues.js';
import type { ImportJobDetailRecord } from '../repositories/import-job.queries.js';
import type { ImportJobRepository } from '../repositories/import-job.repository.js';
import { ImportJobsService } from './import-jobs.service.js';

const WORKSPACE_ID = 'ws-1';
const CREATED_AT = new Date('2026-11-02T10:00:00Z');

function record(id: string, overrides: Partial<ImportJobDetailRecord> = {}): ImportJobDetailRecord {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    userId: 'user-1',
    user: { name: 'Dana' },
    apiKeyId: null,
    apiKey: null,
    mode: CatalogImportMode.Inventory,
    format: CatalogImportFormat.InventoryCsv,
    fileName: 'stock.csv',
    connectionId: null,
    cursor: null,
    totalCount: null,
    status: ImportJobStatus.COMPLETED,
    createdCount: 0,
    linkedCount: 0,
    updatedCount: 3,
    skippedCount: 0,
    failedCount: 1,
    errorMessage: null,
    createdAt: CREATED_AT,
    finishedAt: CREATED_AT,
    issues: [],
    ...overrides,
  };
}

function setup() {
  const repository = {
    create: vi.fn<ImportJobRepository['create']>().mockResolvedValue('job-1'),
    complete: vi.fn<ImportJobRepository['complete']>().mockResolvedValue(),
    fail: vi.fn<ImportJobRepository['fail']>().mockResolvedValue(),
    listPage: vi.fn<ImportJobRepository['listPage']>(),
    findDetail: vi.fn<ImportJobRepository['findDetail']>(),
  };
  const service = new ImportJobsService(repository as unknown as ImportJobRepository);
  return { service, repository };
}

describe('ImportJobsService', () => {
  it('stores counts and issues in file order, failed and skipped together', async () => {
    const { service, repository } = setup();
    const issue = (row: number | undefined, code: ImportIssueCode) => ({ code, message: 'x', row });

    await service.complete(WORKSPACE_ID, 'job-1', {
      ...emptyOutcome(),
      updatedVariants: 3,
      skipped: [issue(4, ImportIssueCode.NotTracked)],
      failed: [
        issue(undefined, ImportIssueCode.DuplicateSku),
        issue(2, ImportIssueCode.UnknownSku),
      ],
    });

    const [, , counts, issues] = repository.complete.mock.calls[0] ?? [];
    expect(counts).toEqual({ created: 0, linked: 0, updated: 3, skipped: 1, failed: 2 });
    expect(issues?.map(({ outcome, issue: { row } }) => [outcome, row])).toEqual([
      [ImportIssueOutcome.FAILED, 2],
      [ImportIssueOutcome.SKIPPED, 4],
      [ImportIssueOutcome.FAILED, undefined],
    ]);
  });

  it('keeps the message of a rejected file but hides unexpected errors', async () => {
    const { service, repository } = setup();

    await service.fail(WORKSPACE_ID, 'job-1', new BadRequestException('Not a CSV'));
    await service.fail(WORKSPACE_ID, 'job-2', new Error('connection refused at 10.0.0.3'));

    expect(repository.fail.mock.calls).toEqual([
      [WORKSPACE_ID, 'job-1', 'Not a CSV'],
      [WORKSPACE_ID, 'job-2', UNEXPECTED_FAILURE_REASON],
    ]);
  });

  it('pages newest first and says when more exist', async () => {
    const { service, repository } = setup();
    repository.listPage.mockResolvedValue({
      records: [record('job-3'), record('job-2'), record('job-1')],
      total: 3,
    });

    const page = await service.list(WORKSPACE_ID, { limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(['job-3', 'job-2']);
    expect(page.nextCursor).toBe('job-2');
    expect(page.total).toBe(3);
    expect(page.items[0]).toMatchObject({
      mode: CatalogImportMode.Inventory,
      counts: { updated: 3, failed: 1 },
      actor: { userName: 'Dana', apiKeyName: null },
    });
  });

  it('returns a job with its issues and 404s one outside the workspace', async () => {
    const { service, repository } = setup();
    repository.findDetail.mockResolvedValueOnce(
      record('job-1', {
        issues: [
          {
            id: 'issue-1',
            workspaceId: WORKSPACE_ID,
            jobId: 'job-1',
            position: 0,
            outcome: ImportIssueOutcome.FAILED,
            code: ImportIssueCode.UnknownSku,
            message: 'No variant has SKU X',
            handle: null,
            sku: 'X',
            row: 2,
          },
        ],
      }),
    );
    repository.findDetail.mockResolvedValueOnce(null);

    const job = await service.get(WORKSPACE_ID, 'job-1');
    expect(job.issues).toEqual([
      {
        outcome: ImportIssueOutcome.FAILED,
        code: ImportIssueCode.UnknownSku,
        message: 'No variant has SKU X',
        handle: undefined,
        sku: 'X',
        row: 2,
      },
    ]);
    await expect(service.get(WORKSPACE_ID, 'elsewhere')).rejects.toThrow(NotFoundException);
  });
});
