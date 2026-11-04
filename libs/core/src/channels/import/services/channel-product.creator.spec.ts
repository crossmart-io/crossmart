import { ImportIssueOutcome, ListingStatus } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ImportIssueCode } from '../../../catalog/enums/import-issue-code.enum.js';
import type { ProductRepository } from '../../../catalog/repositories/product.repository.js';
import { CatalogConflictsService } from '../../../catalog/services/catalog-conflicts.service.js';
import { externalProduct, externalVariant } from '../testing/external-product.factory.js';
import { ChannelProductCreator } from './channel-product.creator.js';

const SYNCED_AT = new Date('2026-11-03T08:00:00Z');
const CONTEXT = {
  workspaceId: 'ws-1',
  connectionId: 'conn-1',
  actor: Actor.user('user-1'),
  syncedAt: SYNCED_AT,
};

function setup() {
  const repository = {
    findExistingHandles: vi.fn(() => Promise.resolve(new Set<string>())),
    findExistingSkus: vi.fn(() => Promise.resolve(new Set(['TAKEN']))),
    createAllWithVariants: vi.fn<ProductRepository['createAllWithVariants']>((_ws, drafts) =>
      Promise.resolve(
        drafts.map((draft) => ({
          id: `${draft.handle}-id`,
          variants: draft.variants.map((_variant, position) => ({
            id: `${draft.handle}-v${position}`,
            position,
            inventoryItemId: `${draft.handle}-inv${position}`,
          })),
        })),
      ),
    ),
  };
  const products = repository as unknown as ProductRepository;
  const creator = new ChannelProductCreator(products, new CatalogConflictsService(products));
  return { creator, repository };
}

describe('ChannelProductCreator', () => {
  it('creates products with a listing that maps every variant and the stock to set', async () => {
    const { creator, repository } = setup();
    const tote = externalProduct('tote', ['TOTE-S', 'TOTE-L'], { active: false });
    tote.variants[1] = externalVariant(tote.variants[1]!.externalId, {
      sku: 'TOTE-L',
      optionValues: ['Size 1'],
      tracked: false,
    });

    const result = await creator.create(CONTEXT, [tote]);

    expect(repository.createAllWithVariants.mock.calls[0]?.[1][0]?.variants[0]?.inventory).toEqual({
      tracked: true,
      quantity: 0,
    });
    expect(result).toMatchObject({ created: 1, failed: 0, productIds: ['tote-id'], issues: [] });
    expect(result.listings).toEqual([
      {
        workspaceId: 'ws-1',
        connectionId: 'conn-1',
        productId: 'tote-id',
        externalId: tote.externalId,
        externalUrl: null,
        status: ListingStatus.INACTIVE,
        syncedAt: SYNCED_AT,
        variants: [
          {
            variantId: 'tote-v0',
            externalId: tote.variants[0]!.externalId,
            externalInventoryId: tote.variants[0]!.externalInventoryId,
          },
          {
            variantId: 'tote-v1',
            externalId: tote.variants[1]!.externalId,
            externalInventoryId: tote.variants[1]!.externalInventoryId,
          },
        ],
      },
    ]);
    expect(result.stock).toEqual([{ inventoryItemId: 'tote-inv0', available: 5 }]);
  });

  it('reports invalid products and SKU clashes instead of creating them', async () => {
    const { creator, repository } = setup();

    const result = await creator.create(CONTEXT, [
      externalProduct('untitled', [null], { title: ' ' }),
      externalProduct('clash', ['TAKEN']),
      externalProduct('fine', ['OK-1']),
    ]);

    expect(
      repository.createAllWithVariants.mock.calls[0]?.[1].map((draft) => draft.handle),
    ).toEqual(['fine']);
    expect(result.failed).toBe(2);
    expect(result.issues.map(({ outcome, issue }) => [outcome, issue.code, issue.handle])).toEqual([
      [ImportIssueOutcome.FAILED, ImportIssueCode.MissingValue, 'untitled'],
      [ImportIssueOutcome.FAILED, ImportIssueCode.DuplicateSku, 'clash'],
    ]);
  });
});
