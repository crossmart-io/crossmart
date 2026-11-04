import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../../../activity/entities/activity-entry.js';
import { CatalogImportMode } from '../../../catalog/enums/catalog-import-mode.enum.js';
import { toImportEntry } from '../../../catalog/rules/import-activity.js';
import type { ChannelImportRunRecord } from '../repositories/channel-import-job.repository.js';

const NOTHING_IMPORTED = 'No product of the store could be imported';

/** The import history entry a channel import's events are about. */
export function toChannelImportEntry(
  job: Pick<ChannelImportRunRecord, 'id' | 'fileName'>,
): ActivityEntry {
  return toImportEntry({
    mode: CatalogImportMode.CreateOrLink,
    jobId: job.id,
    fileName: job.fileName,
  });
}

function toCountsDetail(job: ChannelImportRunRecord): string | undefined {
  const counts = [
    [job.linkedCount, 'linked'],
    [job.updatedCount, 'already linked'],
    [job.skippedCount, 'skipped'],
    [job.failedCount, 'failed'],
  ] as const;
  const parts = counts.filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`);
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * What a finished channel import did, for the activity log. It counts products created or
 * linked; an import that brought in nothing but failed records failed.
 */
export function toChannelImportActivityEntry(
  job: ChannelImportRunRecord,
  productIds: string[],
): ActivityEntry {
  const imported = job.createdCount + job.linkedCount;
  const nothingWorked = imported === 0 && job.updatedCount === 0 && job.failedCount > 0;
  return {
    ...toChannelImportEntry(job),
    relatedSubjectIds: productIds,
    itemCount: imported,
    detail: toCountsDetail(job),
    ...(nothingWorked ? { outcome: ActivityOutcome.FAILED, failureReason: NOTHING_IMPORTED } : {}),
  };
}
