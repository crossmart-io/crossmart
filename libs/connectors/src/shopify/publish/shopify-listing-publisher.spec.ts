import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { fixtureResponse, loadFixture } from '../../sdk/testing/fixtures.js';
import { createShopifyTestKit, FIXTURES, GRAPHQL_URL, SHOP } from '../shopify.fixtures.js';
import { ShopifyScope } from '../shopify.constants.js';
import { shirtDraft, VARIANT_M, VARIANT_S } from './shopify-listing.fixtures.js';

const session = fakeChannelSession(SHOP);
/** A store that approved the app with the Online Store permission. */
const storefrontSession = fakeChannelSession(SHOP, undefined, [ShopifyScope.WritePublications]);
const PRODUCT_GID = 'gid://shopify/Product/7001';

interface GraphqlBody {
  query: string;
  variables: Record<string, unknown>;
}

function bodyOf(request: HttpRequest | undefined): GraphqlBody {
  return JSON.parse(request?.body ?? '{}') as GraphqlBody;
}

function expectPublishCalls(http: ReturnType<typeof createShopifyTestKit>['http']): void {
  http
    .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
    .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'product-set-created.json'));
}

describe('Shopify listing publishing', () => {
  it('creates the product with productSet, mapping every field as the fixture records', async () => {
    const { connector, http } = createShopifyTestKit();
    expectPublishCalls(http);

    const published = await connector.publish(session, shirtDraft());

    const { query, variables } = bodyOf(http.requests[1]);
    expect(query).toContain(
      'productSet(identifier: $identifier, input: $input, synchronous: true)',
    );
    expect(variables).toEqual({
      input: JSON.parse(loadFixture(FIXTURES, 'product-set-input.json')),
    });
    expect(published).toEqual({
      externalId: PRODUCT_GID,
      externalUrl: `https://${SHOP}/admin/products/7001`,
      active: true,
      variants: [
        {
          variantId: VARIANT_S,
          externalId: 'gid://shopify/ProductVariant/8001',
          externalInventoryId: 'gid://shopify/InventoryItem/9001',
        },
        {
          variantId: VARIANT_M,
          externalId: 'gid://shopify/ProductVariant/8002',
          externalInventoryId: 'gid://shopify/InventoryItem/9002',
        },
      ],
    });
    http.assertDone();
  });

  it('updates in place by id: keeps the handle and variant ids, and skips unchanged images', async () => {
    const { connector, http } = createShopifyTestKit();
    expectPublishCalls(http);
    const draft = shirtDraft({ imagesChanged: false });
    draft.variants[0].externalVariantId = 'gid://shopify/ProductVariant/8001';
    draft.product.active = false;

    await connector.update(session, PRODUCT_GID, draft);

    const { variables } = bodyOf(http.requests[1]);
    const input = variables.input as Record<string, unknown> & { variants: object[] };
    expect(variables.identifier).toEqual({ id: PRODUCT_GID });
    expect(input).not.toHaveProperty('handle');
    expect(input).not.toHaveProperty('files');
    expect(input.status).toBe('DRAFT');
    expect(input.variants[0]).toMatchObject({ id: 'gid://shopify/ProductVariant/8001' });
    expect(input.variants[0]).not.toHaveProperty('inventoryQuantities');
    expect(input.variants[1]).toHaveProperty('inventoryQuantities');
  });

  it('gives a product without options Shopify’s placeholder option', async () => {
    const { connector, http } = createShopifyTestKit();
    expectPublishCalls(http);
    const draft = shirtDraft();
    draft.product.optionNames = [];
    draft.variants = draft.variants
      .slice(0, 1)
      .map((variant) => ({ ...variant, optionValues: [] }));

    await connector.publish(session, draft).catch(() => undefined);

    const input = bodyOf(http.requests[1]).variables.input as {
      productOptions: unknown;
      variants: { optionValues: unknown }[];
    };
    expect(input.productOptions).toEqual([
      { name: 'Title', position: 1, values: [{ name: 'Default Title' }] },
    ]);
    expect(input.variants[0].optionValues).toEqual([
      { optionName: 'Title', name: 'Default Title' },
    ]);
  });

  it('turns user errors into one rejected request the merchant can read', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'product-set-user-errors.json'),
      );

    await expect(connector.publish(session, shirtDraft())).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      retryable: false,
      message: "Price must be greater than or equal to 0; Title can't be blank",
    });
  });

  it('waits out throttling before publishing', async () => {
    const { connector, http, sleeper } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'throttled.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'product-set-created.json'));

    await connector.publish(session, shirtDraft());

    expect(sleeper.waits).toEqual([2000]);
  });

  it('delists by archiving the product', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'product-archived.json'));

    await connector.delist(session, PRODUCT_GID);

    expect(bodyOf(http.requests[0]).variables).toEqual({
      product: { id: PRODUCT_GID, status: 'ARCHIVED' },
    });
  });

  it('updates prices with one bulk call per product', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'variant-prices-updated.json'),
      )
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'variant-prices-updated.json'),
      );

    await connector.updatePrices(session, [
      { externalProductId: 'P1', externalVariantId: 'V1', price: '10.00', compareAtPrice: null },
      { externalProductId: 'P2', externalVariantId: 'V3', price: '30.00', compareAtPrice: '40.00' },
      { externalProductId: 'P1', externalVariantId: 'V2', price: '20.00', compareAtPrice: null },
    ]);

    expect(http.requests.map((request) => bodyOf(request).variables)).toEqual([
      {
        productId: 'P1',
        variants: [
          { id: 'V1', price: '10.00', compareAtPrice: null },
          { id: 'V2', price: '20.00', compareAtPrice: null },
        ],
      },
      { productId: 'P2', variants: [{ id: 'V3', price: '30.00', compareAtPrice: '40.00' }] },
    ]);
  });

  describe('the Online Store', () => {
    it('shows a published product there, finding the publication once per connection', async () => {
      const { connector, http } = createShopifyTestKit();
      expectPublishCalls(http);
      http
        .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'publications.json'))
        .expect(
          HttpMethod.Post,
          GRAPHQL_URL,
          fixtureResponse(FIXTURES, 'publishable-published.json'),
        )
        .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'product-set-created.json'))
        .expect(
          HttpMethod.Post,
          GRAPHQL_URL,
          fixtureResponse(FIXTURES, 'publishable-published.json'),
        );

      await connector.publish(storefrontSession, shirtDraft());
      await connector.update(storefrontSession, PRODUCT_GID, shirtDraft());

      expect(bodyOf(http.requests[3]).variables).toEqual({
        id: PRODUCT_GID,
        input: [{ publicationId: 'gid://shopify/Publication/12' }],
      });
      http.assertDone();
    });

    it('skips stores that did not grant the permission, with no extra calls', async () => {
      const { connector, http } = createShopifyTestKit();
      expectPublishCalls(http);

      await connector.publish(session, shirtDraft());

      expect(http.requests).toHaveLength(2);
      http.assertDone();
    });

    it('still returns the published product when Shopify refuses to show it', async () => {
      const { connector, http } = createShopifyTestKit();
      expectPublishCalls(http);
      http
        .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'publications.json'))
        .expect(
          HttpMethod.Post,
          GRAPHQL_URL,
          fixtureResponse(FIXTURES, 'publishable-publish-user-errors.json'),
        );

      const published = await connector.publish(storefrontSession, shirtDraft());

      expect(published.externalId).toBe(PRODUCT_GID);
      http.assertDone();
    });
  });
});
