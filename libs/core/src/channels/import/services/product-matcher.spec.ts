import type {
  ListingRepository,
  ListingWithVariants,
} from '../../repositories/listing.repository.js';
import { Actor } from '../../../activity/entities/actor.js';
import { ProductMatchKind } from '../enums/product-match-kind.enum.js';
import type {
  CatalogMatchCandidate,
  CatalogMatchRepository,
} from '../repositories/catalog-match.repository.js';
import { externalProduct } from '../testing/external-product.factory.js';
import { ProductMatcher } from './product-matcher.js';

const CONTEXT = {
  workspaceId: 'ws-1',
  connectionId: 'conn-1',
  actor: Actor.user('user-1'),
  syncedAt: new Date(),
};

function candidate(id: string, handle: string, sku: string | null = null): CatalogMatchCandidate {
  return { id, handle, variants: [{ id: `${id}-v`, sku, optionValues: [] }] };
}

function setup(options: {
  listings?: ListingWithVariants[];
  linked?: CatalogMatchCandidate[];
  byHandle?: CatalogMatchCandidate[];
  bySku?: CatalogMatchCandidate[];
  listed?: Map<string, string | null>;
}) {
  const listings = {
    findManyByExternalIds: vi.fn<ListingRepository['findManyByExternalIds']>(() =>
      Promise.resolve(options.listings ?? []),
    ),
    findExternalIdsByProduct: vi.fn<ListingRepository['findExternalIdsByProduct']>(() =>
      Promise.resolve(options.listed ?? new Map()),
    ),
  };
  const catalog = {
    findByIds: vi.fn(() => Promise.resolve(options.linked ?? [])),
    findByHandles: vi.fn(() => Promise.resolve(options.byHandle ?? [])),
    findBySkus: vi.fn(() => Promise.resolve(options.bySku ?? [])),
  };
  const matcher = new ProductMatcher(
    listings as unknown as ListingRepository,
    catalog as unknown as CatalogMatchRepository,
  );
  return { matcher, listings, catalog };
}

describe('ProductMatcher', () => {
  it('finds linked products by listing, then by handle, then by SKU, else new', async () => {
    const linkedProduct = externalProduct('linked');
    const { matcher, catalog } = setup({
      listings: [
        {
          productId: 'p-linked',
          externalId: linkedProduct.externalId,
          variants: [{ externalId: 'ext-v', variantId: 'p-linked-v' }],
        } as unknown as ListingWithVariants,
      ],
      linked: [candidate('p-linked', 'something-else')],
      byHandle: [candidate('p-handle', 'by-handle')],
      bySku: [candidate('p-sku', 'other-handle', 'SKU-1')],
    });

    const matches = await matcher.match(CONTEXT, [
      linkedProduct,
      externalProduct('by-handle'),
      externalProduct('by-sku', ['SKU-1']),
      externalProduct('brand-new', ['SKU-9']),
    ]);

    expect(matches.map((match) => [match.kind, match.target?.id])).toEqual([
      [ProductMatchKind.Linked, 'p-linked'],
      [ProductMatchKind.Handle, 'p-handle'],
      [ProductMatchKind.Sku, 'p-sku'],
      [ProductMatchKind.New, undefined],
    ]);
    expect(matches[0]?.knownVariants?.get('ext-v')).toBe('p-linked-v');
    expect(catalog.findBySkus).toHaveBeenCalledWith('ws-1', ['SKU-1', 'SKU-9']);
  });

  it('never links one catalog product to two products of the account', async () => {
    const { matcher } = setup({
      bySku: [candidate('p-shared', 'shared', 'DUP'), candidate('p-listed', 'listed', 'LISTED')],
      listed: new Map([['p-listed', 'gid://shopify/Product/elsewhere']]),
    });

    const matches = await matcher.match(CONTEXT, [
      externalProduct('first', ['DUP']),
      externalProduct('second', ['DUP']),
      externalProduct('third', ['LISTED']),
    ]);

    expect(matches.map((match) => match.kind)).toEqual([
      ProductMatchKind.Sku,
      ProductMatchKind.Taken,
      ProductMatchKind.Taken,
    ]);
  });
});
