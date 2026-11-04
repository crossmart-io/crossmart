import { ActivityOutcome } from '@crossmart/database';
import { ActivityAction } from '../enums/activity-action.enum.js';
import { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';
import { summarizeActivity } from './activity-summary.js';

describe('summarizeActivity', () => {
  it('names the subject', () => {
    expect(
      summarizeActivity({
        action: ActivityAction.ProductUpdated,
        subject: { type: ActivitySubjectType.Product, id: 'p-1', label: 'Linen Shirt' },
      }),
    ).toBe('Updated product “Linen Shirt”');
  });

  it('counts products with the right plural and adds the detail', () => {
    expect(
      summarizeActivity({
        action: ActivityAction.ProductsBulkUpdated,
        itemCount: 1,
        detail: 'status set to archived',
      }),
    ).toBe('Bulk edited 1 product: status set to archived');
    expect(summarizeActivity({ action: ActivityAction.ProductsBulkDeleted, itemCount: 3 })).toBe(
      'Deleted 3 products',
    );
  });

  it('names the operation that failed', () => {
    expect(
      summarizeActivity({
        action: ActivityAction.ProductsImported,
        outcome: ActivityOutcome.FAILED,
      }),
    ).toBe('Product import failed');
  });

  it('describes a stock adjustment with the product, variant and change', () => {
    expect(
      summarizeActivity({
        action: ActivityAction.InventoryAdjusted,
        subject: { type: ActivitySubjectType.Product, id: 'p-1', label: 'Mug' },
        detail: 'MUG-BLUE +5, received',
      }),
    ).toBe('Adjusted stock of “Mug”: MUG-BLUE +5, received');
  });
});
