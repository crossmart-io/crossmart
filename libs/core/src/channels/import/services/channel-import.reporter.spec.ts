import { ChannelError, ChannelErrorCode, ChannelType } from '@crossmart/connectors';
import { ActivityOutcome, ImportJobStatus } from '@crossmart/database';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../../activity/enums/activity-subject-type.enum.js';
import { InMemoryActivityRecorder } from '../../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../../repositories/channel-connection.repository.js';
import type { ListingRepository } from '../../repositories/listing.repository.js';
import type {
  ChannelImportJobRepository,
  ChannelImportRunRecord,
} from '../repositories/channel-import-job.repository.js';
import { ChannelImportReporter } from './channel-import.reporter.js';

const CREATED_AT = new Date('2026-11-03T08:00:00Z');
const JOB: ChannelImportRunRecord = {
  id: 'job-1',
  workspaceId: 'ws-1',
  connectionId: 'conn-1',
  fileName: 'Demo Store',
  status: ImportJobStatus.COMPLETED,
  cursor: null,
  userId: null,
  apiKeyId: 'key-1',
  createdAt: CREATED_AT,
  createdCount: 3,
  linkedCount: 2,
  updatedCount: 0,
  skippedCount: 1,
  failedCount: 0,
};

function setup() {
  const jobs = { findForRun: vi.fn(() => Promise.resolve(JOB)), fail: vi.fn() };
  const connections = { markSynced: vi.fn() };
  const listings = { findProductIdsSyncedSince: vi.fn(() => Promise.resolve(['p-1', 'p-2'])) };
  const activity = new InMemoryActivityRecorder();
  const reporter = new ChannelImportReporter(
    jobs as unknown as ChannelImportJobRepository,
    connections as unknown as ChannelConnectionRepository,
    listings as unknown as ListingRepository,
    activity,
  );
  return { reporter, jobs, connections, listings, activity };
}

describe('ChannelImportReporter', () => {
  it('stamps the connection and records what the import did', async () => {
    const { reporter, connections, listings, activity } = setup();

    await reporter.completed('ws-1', 'job-1');

    expect(connections.markSynced).toHaveBeenCalledWith('ws-1', 'conn-1', expect.any(Date));
    expect(listings.findProductIdsSyncedSince).toHaveBeenCalledWith('conn-1', CREATED_AT);
    expect(activity.recorded[0]?.actor.apiKeyId).toBe('key-1');
    expect(activity.entries[0]).toEqual({
      action: ActivityAction.ChannelCatalogImported,
      subject: { type: ActivitySubjectType.ImportJob, id: 'job-1', label: 'Demo Store' },
      relatedSubjectIds: ['p-1', 'p-2'],
      itemCount: 5,
      detail: '2 linked, 1 skipped',
    });
  });

  it('fails the job with the channel’s message and records the failure', async () => {
    const { reporter, jobs, activity } = setup();
    const error = new ChannelError(
      ChannelType.Shopify,
      ChannelErrorCode.CredentialsRejected,
      'Connect the store again.',
    );

    await reporter.failed(JOB, error);

    expect(jobs.fail).toHaveBeenCalledWith('ws-1', 'job-1', 'Connect the store again.');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ChannelCatalogImported,
      outcome: ActivityOutcome.FAILED,
      failureReason: 'Connect the store again.',
    });
  });
});
