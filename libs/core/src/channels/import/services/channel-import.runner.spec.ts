import { NotFoundException } from '@nestjs/common';
import {
  type CatalogSource,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
  fakeChannelSession,
} from '@crossmart/connectors';
import { ImportJobStatus } from '@crossmart/database';
import { ActivityActorType } from '@crossmart/database';
import type {
  ChannelImportJobRepository,
  ChannelImportRunRecord,
} from '../repositories/channel-import-job.repository.js';
import { externalProduct } from '../testing/external-product.factory.js';
import type { CatalogPageImporter } from './catalog-page.importer.js';
import type { ChannelCatalogOpener } from './channel-catalog.opener.js';
import type { ChannelImportReporter } from './channel-import.reporter.js';
import { ChannelImportRunner } from './channel-import.runner.js';

const REF = { workspaceId: 'ws-1', jobId: 'job-1' };
const OUTCOME = { created: 1, linked: 0, updated: 0, skipped: 0, failed: 0, issues: [] };

function job(overrides: Partial<ChannelImportRunRecord> = {}): ChannelImportRunRecord {
  return {
    id: 'job-1',
    workspaceId: 'ws-1',
    connectionId: 'conn-1',
    fileName: 'Demo Store',
    status: ImportJobStatus.PROCESSING,
    cursor: null,
    userId: 'user-1',
    apiKeyId: null,
    createdAt: new Date(),
    createdCount: 0,
    linkedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    ...overrides,
  };
}

type StoredJob = Awaited<ReturnType<ChannelImportJobRepository['findForRun']>>;

function setup(record: StoredJob, fetchProducts: CatalogSource['fetchProducts']) {
  const jobs = {
    findForRun: vi.fn(() => Promise.resolve(record)),
    recordPage: vi.fn<ChannelImportJobRepository['recordPage']>(() => Promise.resolve()),
  };
  const source = { fetchProducts: vi.fn(fetchProducts) };
  const catalogs = {
    open: vi.fn(() =>
      Promise.resolve({ session: fakeChannelSession('demo.myshopify.com'), source }),
    ),
  };
  const pages = {
    importPage: vi.fn<CatalogPageImporter['importPage']>(() => Promise.resolve(OUTCOME)),
  };
  const reporter = { completed: vi.fn(), failed: vi.fn() };
  const runner = new ChannelImportRunner(
    jobs as unknown as ChannelImportJobRepository,
    catalogs as unknown as ChannelCatalogOpener,
    pages as unknown as CatalogPageImporter,
    reporter as unknown as ChannelImportReporter,
  );
  return { runner, jobs, source, pages, reporter };
}

describe('ChannelImportRunner', () => {
  it('imports page after page from the stored cursor and completes', async () => {
    const pagesByCursor = new Map([
      ['resume-here', { items: [externalProduct('a')], nextCursor: 'next', totalCount: 2 }],
      ['next', { items: [externalProduct('b')], nextCursor: null, totalCount: 2 }],
    ]);
    const { runner, jobs, source, pages, reporter } = setup(
      job({ cursor: 'resume-here' }),
      (_s, cursor) =>
        Promise.resolve(pagesByCursor.get(cursor ?? '') ?? { items: [], nextCursor: null }),
    );

    await runner.run(REF, { finalAttempt: false });

    expect(source.fetchProducts.mock.calls.map(([, cursor]) => cursor)).toEqual([
      'resume-here',
      'next',
    ]);
    expect(pages.importPage.mock.calls[0]?.[0]).toMatchObject({
      workspaceId: 'ws-1',
      connectionId: 'conn-1',
    });
    expect(pages.importPage.mock.calls[0]?.[0].actor.type).toBe(ActivityActorType.USER);
    expect(jobs.recordPage.mock.calls.map(([, , progress]) => progress.nextCursor)).toEqual([
      'next',
      null,
    ]);
    expect(reporter.completed).toHaveBeenCalledWith('ws-1', 'job-1');
  });

  it('does nothing for an import that finished or is unknown', async () => {
    for (const record of [job({ status: ImportJobStatus.COMPLETED }), null]) {
      const { runner, source } = setup(record, () => Promise.reject(new Error('never')));
      await runner.run(REF, { finalAttempt: true });
      expect(source.fetchProducts).not.toHaveBeenCalled();
    }
  });

  it('rethrows outages for a retry, and fails the import on the final attempt', async () => {
    const outage = new ChannelError(
      ChannelType.Shopify,
      ChannelErrorCode.ChannelUnavailable,
      'down',
    );
    const retried = setup(job(), () => Promise.reject(outage));
    await expect(retried.runner.run(REF, { finalAttempt: false })).rejects.toBe(outage);
    expect(retried.reporter.failed).not.toHaveBeenCalled();

    const final = setup(job(), () => Promise.reject(outage));
    await final.runner.run(REF, { finalAttempt: true });
    expect(final.reporter.failed).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1' }),
      outage,
    );
  });

  it.each([
    new ChannelError(ChannelType.Shopify, ChannelErrorCode.CredentialsRejected, 'reconnect'),
    new NotFoundException(),
  ])('fails at once on errors a retry cannot fix (%#)', async (error) => {
    const { runner, reporter } = setup(job(), () => Promise.reject(error));

    await runner.run(REF, { finalAttempt: false });

    expect(reporter.failed).toHaveBeenCalledWith(expect.anything(), error);
    expect(reporter.completed).not.toHaveBeenCalled();
  });
});
