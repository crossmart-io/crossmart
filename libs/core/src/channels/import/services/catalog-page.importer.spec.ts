import { ImportIssueOutcome, InventoryMovementReason } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ImportIssueCode } from '../../../catalog/enums/import-issue-code.enum.js';
import type { StockLevelsService } from '../../../inventory/services/stock-levels.service.js';
import type { ListingRecord, ListingRepository } from '../../repositories/listing.repository.js';
import type { ProductMatch } from '../entities/channel-import.js';
import { ProductMatchKind } from '../enums/product-match-kind.enum.js';
import { externalProduct } from '../testing/external-product.factory.js';
import { CatalogPageImporter } from './catalog-page.importer.js';
import type { ChannelProductCreator, CreatedProducts } from './channel-product.creator.js';
import type { ProductMatcher } from './product-matcher.js';

const ACTOR = Actor.user('user-1');
const CONTEXT = { workspaceId: 'ws-1', connectionId: 'conn-1', actor: ACTOR, syncedAt: new Date() };

function target(id: string, skus: (string | null)[]) {
  return {
    id,
    variants: skus.map((sku, index) => ({ id: `${id}-v${index}`, sku, optionValues: [] })),
  };
}

function setup(matches: ProductMatch[], created: Partial<CreatedProducts> = {}) {
  const matcher = { match: vi.fn(() => Promise.resolve(matches)) };
  const creator = {
    create: vi.fn(() =>
      Promise.resolve({
        created: 0,
        failed: 0,
        productIds: [],
        listings: [],
        stock: [],
        issues: [],
        ...created,
      }),
    ),
  };
  const listings = { upsertManyByExternalId: vi.fn<ListingRepository['upsertManyByExternalId']>() };
  const stock = { setAvailable: vi.fn<StockLevelsService['setAvailable']>() };
  const importer = new CatalogPageImporter(
    matcher as unknown as ProductMatcher,
    creator as unknown as ChannelProductCreator,
    listings as unknown as ListingRepository,
    stock as unknown as StockLevelsService,
  );
  return { importer, creator, listings, stock };
}

describe('CatalogPageImporter', () => {
  it('creates new products, links matches, refreshes linked ones, and counts each', async () => {
    const fresh = externalProduct('fresh');
    const byHandle = externalProduct('by-handle', ['H-1', 'H-2']);
    const linked = externalProduct('linked', ['L-1']);
    const createdListing = { productId: 'fresh-id' } as ListingRecord;
    const { importer, creator, listings, stock } = setup(
      [
        { product: fresh, kind: ProductMatchKind.New },
        { product: byHandle, kind: ProductMatchKind.Handle, target: target('p-h', ['H-1']) },
        {
          product: linked,
          kind: ProductMatchKind.Linked,
          target: target('p-l', ['L-1']),
          knownVariants: new Map(),
        },
      ],
      { created: 1, listings: [createdListing], stock: [{ inventoryItemId: 'inv', available: 5 }] },
    );

    const outcome = await importer.importPage(CONTEXT, [fresh, byHandle, linked]);

    expect(creator.create).toHaveBeenCalledWith(CONTEXT, [fresh]);
    const written = listings.upsertManyByExternalId.mock.calls[0]?.[0] ?? [];
    expect(written.map((listing) => listing.productId)).toEqual(['fresh-id', 'p-h', 'p-l']);
    expect(written[1]?.variants).toEqual([
      {
        variantId: 'p-h-v0',
        externalId: byHandle.variants[0]!.externalId,
        externalInventoryId: byHandle.variants[0]!.externalInventoryId,
      },
    ]);
    expect(stock.setAvailable).toHaveBeenCalledWith(
      'ws-1',
      [{ inventoryItemId: 'inv', available: 5 }],
      {
        reason: InventoryMovementReason.IMPORTED,
        actor: ACTOR,
      },
    );
    expect(outcome).toMatchObject({ created: 1, linked: 1, updated: 1, skipped: 0, failed: 0 });
    expect(outcome.issues[0]?.issue).toMatchObject({
      code: ImportIssueCode.UnmatchedVariant,
      sku: 'H-2',
    });
  });

  it('reports products taken by another link and products whose variants match nothing', async () => {
    const taken = externalProduct('taken', ['T-1']);
    const unmatched = externalProduct('unmatched', ['U-1', 'U-2']);
    const { importer, listings } = setup([
      { product: taken, kind: ProductMatchKind.Taken, target: target('p-t', ['T-1']) },
      { product: unmatched, kind: ProductMatchKind.Sku, target: target('p-u', ['X', 'Y']) },
    ]);

    const outcome = await importer.importPage(CONTEXT, [taken, unmatched]);

    expect(listings.upsertManyByExternalId).toHaveBeenCalledWith([]);
    expect(outcome).toMatchObject({ created: 0, linked: 0, updated: 0, skipped: 1, failed: 1 });
    expect(outcome.issues.map(({ outcome: kind, issue }) => [kind, issue.code])).toEqual([
      [ImportIssueOutcome.FAILED, ImportIssueCode.UnmatchedVariant],
      [ImportIssueOutcome.SKIPPED, ImportIssueCode.AlreadyLinked],
    ]);
  });
});
