import { ActivityOutcome, ImportJobStatus } from '@crossmart/database';
import { summarizeActivity } from '../../../activity/rules/activity-summary.js';
import type { ChannelImportRunRecord } from '../repositories/channel-import-job.repository.js';
import { toChannelImportActivityEntry } from './channel-import-activity.js';

function job(counts: Partial<ChannelImportRunRecord>): ChannelImportRunRecord {
  return {
    id: 'job-1',
    workspaceId: 'ws-1',
    connectionId: 'conn-1',
    fileName: 'Demo Store',
    status: ImportJobStatus.COMPLETED,
    cursor: null,
    userId: 'user-1',
    apiKeyId: null,
    createdAt: new Date(),
    createdCount: 0,
    linkedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    ...counts,
  };
}

describe('toChannelImportActivityEntry', () => {
  it('summarizes created and linked products with the other counts', () => {
    const entry = toChannelImportActivityEntry(
      job({ createdCount: 4, linkedCount: 1, updatedCount: 2, failedCount: 1 }),
      [],
    );

    expect(summarizeActivity(entry)).toBe(
      'Imported 5 products from “Demo Store”: 1 linked, 2 already linked, 1 failed',
    );
  });

  it('fails an import that brought in nothing but failures', () => {
    const entry = toChannelImportActivityEntry(job({ failedCount: 3 }), []);

    expect(entry.outcome).toBe(ActivityOutcome.FAILED);
    expect(summarizeActivity(entry)).toBe('Channel import failed');
  });

  it('succeeds on a re-run that only refreshed linked products', () => {
    const entry = toChannelImportActivityEntry(job({ updatedCount: 3 }), []);

    expect(entry.outcome).toBeUndefined();
    expect(summarizeActivity(entry)).toBe('Read the catalog from “Demo Store”: 3 already linked');
  });
});
