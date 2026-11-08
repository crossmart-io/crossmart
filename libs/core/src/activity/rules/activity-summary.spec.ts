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

  it('counts and names the unused agents removed', () => {
    expect(
      summarizeActivity({
        action: ActivityAction.UnusedAgentsRemoved,
        itemCount: 2,
        detail: 'Claude, Cursor',
      }),
    ).toBe('Removed 2 unused agents: Claude, Cursor');
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

  it('names the file and what each kind of import changed', () => {
    const subject = { type: ActivitySubjectType.ImportJob, id: 'job-1', label: 'stock.csv' };
    expect(
      summarizeActivity({ action: ActivityAction.ProductsImported, subject, itemCount: 2 }),
    ).toBe('Imported 2 products from “stock.csv”');
    expect(
      summarizeActivity({ action: ActivityAction.ProductsUpdatedByImport, subject, itemCount: 1 }),
    ).toBe('Updated 1 product from “stock.csv”');
    expect(
      summarizeActivity({
        action: ActivityAction.StockImported,
        subject,
        itemCount: 12,
        detail: '1 skipped',
      }),
    ).toBe('Set stock of 12 variants from “stock.csv”: 1 skipped');
    expect(
      summarizeActivity({ action: ActivityAction.StockImported, outcome: ActivityOutcome.FAILED }),
    ).toBe('Stock import failed');
  });

  it('names the channel and account of connection events', () => {
    const subject = { type: ActivitySubjectType.ChannelConnection, id: 'c-1', label: 'Demo Store' };

    expect(
      summarizeActivity({ action: ActivityAction.ChannelConnected, subject, detail: 'Shopify' }),
    ).toBe('Connected Shopify “Demo Store”');
    expect(
      summarizeActivity({ action: ActivityAction.ChannelDisconnected, subject, detail: 'Shopify' }),
    ).toBe('Disconnected Shopify “Demo Store”');
    expect(
      summarizeActivity({
        action: ActivityAction.ChannelConnectFailed,
        outcome: ActivityOutcome.FAILED,
        detail: 'Shopify',
      }),
    ).toBe('Connecting a channel failed');
  });

  it('names the product and store of listing events, and the connection of rule changes', () => {
    const product = { type: ActivitySubjectType.Product, id: 'p-1', label: 'Mug' };
    const store = { type: ActivitySubjectType.ChannelConnection, id: 'c-1', label: 'Demo Store' };

    expect(
      summarizeActivity({
        action: ActivityAction.ListingPublished,
        subject: product,
        detail: 'Demo Store',
      }),
    ).toBe('Published “Mug” on Demo Store');
    expect(
      summarizeActivity({
        action: ActivityAction.ListingDelisted,
        subject: product,
        detail: 'Demo Store',
      }),
    ).toBe('Delisted “Mug” on Demo Store');
    expect(
      summarizeActivity({
        action: ActivityAction.ChannelPricingUpdated,
        subject: store,
        detail: '+15%, .99',
      }),
    ).toBe('Changed the pricing rule of “Demo Store”: +15%, .99');
    expect(
      summarizeActivity({
        action: ActivityAction.ListingSyncFailed,
        outcome: ActivityOutcome.FAILED,
      }),
    ).toBe('Syncing a listing failed');
  });

  it('counts the stock levels reconciliation corrected, and names a refused stock sync', () => {
    const subject = { type: ActivitySubjectType.Product, id: 'p-1', label: 'Mug' };
    expect(
      summarizeActivity({
        action: ActivityAction.StockReconciled,
        subject,
        itemCount: 2,
        detail: 'Outlet',
      }),
    ).toBe('Corrected the stock of 2 items of “Mug” on Outlet');
    expect(
      summarizeActivity({ action: ActivityAction.StockSyncFailed, subject, detail: 'eBay' }),
    ).toBe('Could not sync the stock of “Mug” on eBay');
  });
});
