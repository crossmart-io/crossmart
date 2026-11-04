import { Injectable } from '@nestjs/common';
import { ImportJobStatus } from '@crossmart/database';
import type { ChannelImportJobRef, ChannelImportRunOptions } from '../entities/channel-import.js';
import {
  type ChannelImportRunRecord,
  ChannelImportJobRepository,
} from '../repositories/channel-import-job.repository.js';
import { toImportActor } from '../rules/import-actor.js';
import { isPermanentImportFailure } from '../rules/import-failure.js';
import { CatalogPageImporter } from './catalog-page.importer.js';
import { ChannelCatalogOpener } from './channel-catalog.opener.js';
import { ChannelImportReporter } from './channel-import.reporter.js';

/**
 * Runs a channel import in the worker: reads the catalog page by page from the job's cursor,
 * imports each page and stores the next cursor with its counts. A retried or repeated run
 * resumes where the last one stopped, and a finished import is never run again.
 */
@Injectable()
export class ChannelImportRunner {
  constructor(
    private readonly jobs: ChannelImportJobRepository,
    private readonly catalogs: ChannelCatalogOpener,
    private readonly pages: CatalogPageImporter,
    private readonly reporter: ChannelImportReporter,
  ) {}

  /**
   * Throws when the run should be retried. A permanent failure, or one on the final attempt,
   * marks the import as failed instead.
   */
  async run(ref: ChannelImportJobRef, options: ChannelImportRunOptions): Promise<void> {
    const job = await this.jobs.findForRun(ref.workspaceId, ref.jobId);
    if (!job?.connectionId || job.status !== ImportJobStatus.PROCESSING) {
      return;
    }
    try {
      await this.importPages(job, job.connectionId);
    } catch (error) {
      if (options.finalAttempt || isPermanentImportFailure(error)) {
        await this.reporter.failed(job, error);
        return;
      }
      throw error;
    }
    await this.reporter.completed(job.workspaceId, job.id);
  }

  private async importPages(job: ChannelImportRunRecord, connectionId: string): Promise<void> {
    const { workspaceId } = job;
    const { session, source } = await this.catalogs.open(workspaceId, connectionId);
    const actor = toImportActor(job);
    let cursor = job.cursor;
    do {
      const page = await source.fetchProducts(session, cursor);
      const context = { workspaceId, connectionId, actor, syncedAt: new Date() };
      const outcome = await this.pages.importPage(context, page.items);
      await this.jobs.recordPage(workspaceId, job.id, {
        nextCursor: page.nextCursor,
        totalCount: page.totalCount ?? null,
        outcome,
      });
      cursor = page.nextCursor;
    } while (cursor !== null);
  }
}
