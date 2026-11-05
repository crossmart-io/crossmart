import { describeError } from '@crossmart/common';
import { Injectable, Logger } from '@nestjs/common';
import { ActivityOutcome } from '@crossmart/database';
import { ActivityRecorder } from '../../../activity/services/activity-recorder.js';
import { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';
import { ListingRepository } from '../../repositories/listing.repository.js';
import {
  type ChannelImportRunRecord,
  ChannelImportJobRepository,
} from '../repositories/channel-import-job.repository.js';
import { toImportActor } from '../rules/import-actor.js';
import {
  toChannelImportActivityEntry,
  toChannelImportEntry,
} from '../rules/channel-import-activity.js';
import { toImportFailureReason } from '../rules/import-failure.js';

/** Closes an import: stamps the connection and records the outcome in the activity log. */
@Injectable()
export class ChannelImportReporter {
  private readonly logger = new Logger(ChannelImportReporter.name);

  constructor(
    private readonly jobs: ChannelImportJobRepository,
    private readonly connections: ChannelConnectionRepository,
    private readonly listings: ListingRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async completed(workspaceId: string, jobId: string): Promise<void> {
    const job = await this.jobs.findForRun(workspaceId, jobId);
    if (!job?.connectionId) return;
    await this.connections.markSynced(workspaceId, job.connectionId, new Date());
    const productIds = await this.listings.findProductIdsSyncedSince(
      job.connectionId,
      job.createdAt,
    );
    await this.activity.record(
      workspaceId,
      toImportActor(job),
      toChannelImportActivityEntry(job, productIds),
    );
  }

  /** Marks the import failed with a reason that is safe to show, and logs only a safe description of the error. */
  async failed(job: ChannelImportRunRecord, error: unknown): Promise<void> {
    const reason = toImportFailureReason(error);
    const kind = describeError(error);
    this.logger.warn(`Import ${job.id} failed (${kind}): ${reason}`);
    await this.jobs.fail(job.workspaceId, job.id, reason);
    await this.activity.record(job.workspaceId, toImportActor(job), {
      ...toChannelImportEntry(job),
      outcome: ActivityOutcome.FAILED,
      failureReason: reason,
    });
  }
}
