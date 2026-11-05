import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  CONNECTION_ID,
  listingRecord,
  PRODUCT_ID,
  productDetail,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ListingContentReader } from './listing-content.reader.js';
import type { SyncProductLoader } from './sync-product.loader.js';

const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };

function setup() {
  const products = { find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(productDetail()) };
  const listings = {
    findPrimary: vi.fn<ListingSyncRepository['findPrimary']>().mockResolvedValue(null),
  };
  const reader = new ListingContentReader(
    products as unknown as SyncProductLoader,
    listings as unknown as ListingSyncRepository,
  );
  return { reader, products, listings };
}

describe('ListingContentReader', () => {
  it('shows the product’s own content where the listing has no override', async () => {
    const { reader } = setup();

    expect((await reader.read(TARGET))?.content).toEqual({
      title: 'Mug',
      descriptionHtml: '<p>Stoneware.</p>',
    });
  });

  it('shows each overridden field instead', async () => {
    const { reader, listings } = setup();
    const listing = listingRecord();
    listings.findPrimary.mockResolvedValue({
      ...listing,
      override: { title: 'Mug (eBay)', descriptionHtml: null } as typeof listing.override,
    });

    expect((await reader.read(TARGET))?.content).toEqual({
      title: 'Mug (eBay)',
      descriptionHtml: '<p>Stoneware.</p>',
    });
  });

  it('is null once the product is gone', async () => {
    const { reader, products } = setup();
    products.find.mockResolvedValue(null);

    expect(await reader.read(TARGET)).toBeNull();
  });
});
