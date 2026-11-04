import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import type { ImportOutcome } from '../entities/catalog-import.js';
import { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';

/** The import history entry an event is about. */
export interface ImportedFile {
  mode: CatalogImportMode;
  jobId: string;
  fileName: string;
}

interface ModeActivity {
  action: ActivityAction;
  /** The records the event counts: products created or updated, or variants whose stock was set. */
  count: (outcome: ImportOutcome) => number;
  nothingApplied: string;
}

const MODE_ACTIVITY: Record<CatalogImportMode, ModeActivity> = {
  [CatalogImportMode.Create]: {
    action: ActivityAction.ProductsImported,
    count: (outcome) => outcome.createdProducts,
    nothingApplied: 'No product in the file could be imported',
  },
  [CatalogImportMode.Update]: {
    action: ActivityAction.ProductsUpdatedByImport,
    count: (outcome) => outcome.updatedProducts,
    nothingApplied: 'No product in the file could be updated',
  },
  [CatalogImportMode.Inventory]: {
    action: ActivityAction.StockImported,
    count: (outcome) => outcome.updatedVariants,
    nothingApplied: 'No stock level in the file could be set',
  },
  [CatalogImportMode.CreateOrLink]: {
    action: ActivityAction.ChannelCatalogImported,
    count: (outcome) => outcome.createdProducts,
    nothingApplied: 'No product of the store could be imported',
  },
};

/** The event of an import, linked to its history entry. Outcome and counts are added on top. */
export function toImportEntry(file: ImportedFile): ActivityEntry {
  return {
    action: MODE_ACTIVITY[file.mode].action,
    subject: { type: ActivitySubjectType.ImportJob, id: file.jobId, label: file.fileName },
  };
}

/**
 * What an import did, for the activity log. The products it touched carry the event in their
 * own history. An import that applied nothing but rejected records failed; any other succeeded.
 */
export function toImportActivityEntry(file: ImportedFile, outcome: ImportOutcome): ActivityEntry {
  const { count, nothingApplied } = MODE_ACTIVITY[file.mode];
  const applied = count(outcome);
  const failed = outcome.failed.length;
  return {
    ...toImportEntry(file),
    relatedSubjectIds: outcome.productIds,
    itemCount: applied,
    detail: toCountsDetail(outcome.skipped.length, failed),
    ...(applied === 0 && failed > 0
      ? { outcome: ActivityOutcome.FAILED, failureReason: nothingApplied }
      : {}),
  };
}

function toCountsDetail(skipped: number, failed: number): string | undefined {
  const counts = [
    skipped > 0 ? `${skipped} skipped` : null,
    failed > 0 ? `${failed} failed` : null,
  ].filter((count) => count !== null);
  return counts.length > 0 ? counts.join(', ') : undefined;
}
