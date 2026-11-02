import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import type { ImportOutcome } from '../entities/catalog-import.js';

const NOTHING_IMPORTED = 'No product in the file could be imported';

export const IMPORT_ACTIVITY_ENTRY: ActivityEntry = {
  action: ActivityAction.ProductsImported,
  subject: { type: ActivitySubjectType.CatalogImport },
};

/** An import that changed nothing but rejected records failed; anything else succeeded. */
export function toImportActivityEntry(outcome: ImportOutcome): ActivityEntry {
  const failed = outcome.failed.length;
  const changed = outcome.createdProducts + outcome.updatedProducts + outcome.updatedVariants;
  const counts = [
    outcome.skipped.length > 0 ? `${outcome.skipped.length} skipped` : null,
    failed > 0 ? `${failed} failed` : null,
  ].filter((count) => count !== null);
  const isFailure = changed === 0 && failed > 0;
  return {
    ...IMPORT_ACTIVITY_ENTRY,
    itemCount: changed,
    detail: counts.length > 0 ? counts.join(', ') : undefined,
    ...(isFailure ? { outcome: ActivityOutcome.FAILED, failureReason: NOTHING_IMPORTED } : {}),
  };
}
