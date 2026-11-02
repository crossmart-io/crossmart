import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import { emptyOutcome } from '../import/import-issues.js';
import { toImportActivityEntry } from './import-activity.js';

const FILE = { jobId: 'job-1', fileName: 'catalog.csv' };
const EXISTING = { code: ImportIssueCode.AlreadyExists, message: 'exists', handle: 'mug' };

describe('toImportActivityEntry', () => {
  it.each([
    [CatalogImportMode.Create, ActivityAction.ProductsImported, 2],
    [CatalogImportMode.Update, ActivityAction.ProductsUpdatedByImport, 3],
    [CatalogImportMode.Inventory, ActivityAction.StockImported, 4],
  ])('counts what a %s import applied', (mode, action, itemCount) => {
    const outcome = {
      ...emptyOutcome(),
      createdProducts: 2,
      updatedProducts: 3,
      updatedVariants: 4,
      skipped: [EXISTING],
    };

    expect(toImportActivityEntry({ ...FILE, mode }, outcome)).toMatchObject({
      action,
      itemCount,
      detail: '1 skipped',
    });
  });

  it('reports no detail when every record was applied', () => {
    const entry = toImportActivityEntry(
      { ...FILE, mode: CatalogImportMode.Create },
      { ...emptyOutcome(), createdProducts: 1 },
    );

    expect(entry.detail).toBeUndefined();
    expect(entry.outcome).toBeUndefined();
  });
});
