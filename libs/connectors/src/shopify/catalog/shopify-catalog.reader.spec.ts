import { ChannelCapability } from '../../sdk/channel-capability.enum.js';
import { supportsCapability } from '../../sdk/capabilities/capability-contracts.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createShopifyTestKit, FIXTURES, GRAPHQL_URL, SHOP } from '../shopify.fixtures.js';

const LOCATION_ID = 'gid://shopify/Location/71000000001';
const PAGE_2_CURSOR = 'eyJsYXN0X2lkIjo5MDAzfQ==';

interface GraphqlBody {
  query: string;
  variables: Record<string, unknown>;
}

function bodyOf(request: HttpRequest | undefined): GraphqlBody {
  return JSON.parse(request?.body ?? '{}') as GraphqlBody;
}

function expectPage(kit: ReturnType<typeof createShopifyTestKit>, page: string): void {
  kit.http
    .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
    .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, page));
}

describe('Shopify catalog import (contract)', () => {
  const session = fakeChannelSession(SHOP);

  it('declares the import capability', () => {
    const { connector } = createShopifyTestKit();
    expect(supportsCapability(connector, ChannelCapability.ImportCatalog)).toBe(true);
  });

  it('reads a page of products at the primary location, in id order', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-1.json');
    kit.http.expect(
      HttpMethod.Post,
      GRAPHQL_URL,
      fixtureResponse(FIXTURES, 'product-variants.json'),
    );

    const page = await kit.connector.fetchProducts(session, null);

    kit.http.assertDone();
    const products = bodyOf(kit.http.requests[1]);
    expect(products.query).toContain('sortKey: ID');
    expect(products.variables).toEqual({
      first: 8,
      after: null,
      variantsFirst: 10,
      mediaFirst: 10,
      locationId: LOCATION_ID,
    });
    expect(page.nextCursor).toBe(PAGE_2_CURSOR);
    expect(page.totalCount).toBe(4);
    expect(page.items.map((product) => product.handle)).toEqual([
      'leather-card-holder',
      'canvas-tote',
      'gift-card-sleeve',
    ]);
  });

  it('maps a product without options, with its stock, weight, cost and images', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-1.json');
    kit.http.expect(
      HttpMethod.Post,
      GRAPHQL_URL,
      fixtureResponse(FIXTURES, 'product-variants.json'),
    );

    const [cardHolder] = (await kit.connector.fetchProducts(session, null)).items;

    expect(cardHolder).toEqual({
      externalId: 'gid://shopify/Product/9001',
      handle: 'leather-card-holder',
      title: 'Leather Card Holder',
      descriptionHtml: '<p>Leather Card Holder made by hand.</p>',
      vendor: 'Northfield Goods',
      productType: 'Accessories',
      tags: ['leather', 'wallet'],
      active: true,
      optionNames: [],
      images: [
        {
          url: 'https://cdn.shopify.com/s/files/1/0001/products/card-holder.jpg',
          altText: 'Card holder, front',
        },
      ],
      externalUrl: 'https://shop.example.com/products/leather-card-holder',
      variants: [
        {
          externalId: 'gid://shopify/ProductVariant/8001',
          externalInventoryId: 'gid://shopify/InventoryItem/8501',
          sku: 'NF-LCH-01',
          barcode: '0123456789012',
          optionValues: [],
          price: '39.00',
          compareAtPrice: null,
          tracked: true,
          available: 14,
          weightGrams: 40,
          requiresShipping: true,
          taxable: true,
          continueSellingWhenOutOfStock: false,
          unitCost: '12.50',
        },
      ],
    });
  });

  it('reads every variant of a product with more than the first page holds', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-1.json');
    kit.http.expect(
      HttpMethod.Post,
      GRAPHQL_URL,
      fixtureResponse(FIXTURES, 'product-variants.json'),
    );

    const [, tote] = (await kit.connector.fetchProducts(session, null)).items;

    expect(bodyOf(kit.http.requests[2]).variables).toEqual({
      productId: 'gid://shopify/Product/9002',
      first: 100,
      after: 'eyJsYXN0X2lkIjo4MTA5fQ==',
      locationId: LOCATION_ID,
    });
    expect(tote?.optionNames).toEqual(['Color', 'Size']);
    expect(tote?.variants).toHaveLength(12);
    expect(tote?.variants[11]).toMatchObject({
      sku: 'NF-TOTE-NAV-L',
      optionValues: ['Navy', 'L'],
      compareAtPrice: '80.00',
      weightGrams: 454,
      available: 3,
    });
  });

  it('maps drafts, untracked stock and blank text', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-1.json');
    kit.http.expect(
      HttpMethod.Post,
      GRAPHQL_URL,
      fixtureResponse(FIXTURES, 'product-variants.json'),
    );

    const [, , sleeve] = (await kit.connector.fetchProducts(session, null)).items;

    expect(sleeve).toMatchObject({ active: false, vendor: null, productType: null, images: [] });
    expect(sleeve?.variants[0]).toMatchObject({
      sku: null,
      tracked: false,
      available: null,
      weightGrams: null,
      unitCost: null,
      continueSellingWhenOutOfStock: true,
    });
  });

  it('reads the last page from a cursor', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-2.json');

    const page = await kit.connector.fetchProducts(session, PAGE_2_CURSOR);

    expect(bodyOf(kit.http.requests[1]).variables.after).toBe(PAGE_2_CURSOR);
    expect(page.nextCursor).toBeNull();
    const [scarf] = page.items;
    expect(scarf?.active).toBe(false);
    expect(scarf?.variants.map((variant) => variant.available)).toEqual([-2, null]);
    expect(scarf?.variants[0]?.weightGrams).toBe(227);
  });

  it('waits out throttling before reading the page', async () => {
    const kit = createShopifyTestKit();
    kit.http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'throttled.json'))
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'catalog-products-page-2.json'),
      );

    const page = await kit.connector.fetchProducts(session, PAGE_2_CURSOR);

    expect(page.items).toHaveLength(1);
    expect(kit.sleeper.waits).toHaveLength(1);
  });

  it('refuses a store without a location', async () => {
    const kit = createShopifyTestKit();
    kit.http.expect(
      HttpMethod.Post,
      GRAPHQL_URL,
      fixtureResponse(FIXTURES, 'primary-location-none.json'),
    );

    await expect(kit.connector.fetchProducts(session, null)).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
    });
  });

  it('never sends the access token anywhere but the header', async () => {
    const kit = createShopifyTestKit();
    expectPage(kit, 'catalog-products-page-2.json');

    await kit.connector.fetchProducts(fakeChannelSession(SHOP, 'shpat_secret'), PAGE_2_CURSOR);

    for (const request of kit.http.requests) {
      expect(request.url).not.toContain('shpat_secret');
      expect(request.body).not.toContain('shpat_secret');
    }
  });
});
