import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES } from '../ebay.fixtures.js';
import {
  API,
  ebaySettings,
  INVENTORY,
  MUG_SKU,
  mugDraft,
  offersUrl,
  SHIRT_GROUP,
  shirtDraft,
  VARIANT_M,
  VARIANT_S,
} from './ebay-listing.fixtures.js';
import { MISSING_LOCATION, MISSING_POLICIES } from './ebay-listing-terms.js';
import { NOT_ACTIVE, NO_REFERENCE } from './ebay-listing-publisher.js';

const SHIRT_M_SKU = 'CM22222222222242228222222222222222';
const NO_CONTENT = { status: 204, headers: {}, body: '' };
const session = fakeChannelSession(ACCOUNT_ID);

function bodyOf(request: HttpRequest | undefined): Record<string, unknown> {
  return JSON.parse(request?.body ?? '{}') as Record<string, unknown>;
}

function requestTo(requests: readonly HttpRequest[], method: HttpMethod, url: string) {
  return requests.find((request) => request.method === method && request.url === url);
}

describe('EbayListingPublisher', () => {
  it('publishes a single-variant product in the category eBay suggests', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(
        HttpMethod.Get,
        `${API}/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US`,
        fixtureResponse(FIXTURES, 'category-tree.json'),
      )
      .expect(
        HttpMethod.Get,
        `${API}/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=Stoneware+mug`,
        fixtureResponse(FIXTURES, 'category-suggestions.json'),
      )
      .expect(HttpMethod.Put, `${INVENTORY}/inventory_item/${MUG_SKU}`, NO_CONTENT)
      .expect(
        HttpMethod.Get,
        offersUrl(MUG_SKU),
        fixtureResponse(FIXTURES, 'offer-not-found.json', 404),
      )
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/offer`,
        fixtureResponse(FIXTURES, 'offer-created.json', 201),
      )
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/offer/9000000002/publish`,
        fixtureResponse(FIXTURES, 'offer-published.json'),
      );

    const published = await connector.publish(session, mugDraft());

    http.assertDone();
    expect(published).toEqual({
      externalId: '110553000002',
      externalUrl: 'https://sandbox.ebay.com/itm/110553000002',
      active: true,
      variants: [
        {
          variantId: '55555555-5555-4555-8555-555555555555',
          externalId: MUG_SKU,
          externalInventoryId: null,
        },
      ],
      category: {
        id: '57990',
        name: "Clothing, Shoes & Accessories > Men's Clothing > Casual Button-Down Shirts",
      },
    });
    const item = requestTo(http.requests, HttpMethod.Put, `${INVENTORY}/inventory_item/${MUG_SKU}`);
    expect(item?.headers?.['content-language']).toBe('en-US');
    expect(bodyOf(item)).toEqual({
      availability: { shipToLocationAvailability: { quantity: 3 } },
      condition: 'NEW',
      product: {
        title: 'Stoneware mug',
        description: 'Stoneware mug',
        imageUrls: [],
        aspects: {},
        upc: ['012345678905'],
      },
    });
    expect(bodyOf(requestTo(http.requests, HttpMethod.Post, `${INVENTORY}/offer`))).toEqual({
      sku: MUG_SKU,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      availableQuantity: 3,
      categoryId: '57990',
      listingDescription: 'Stoneware mug',
      listingPolicies: {
        fulfillmentPolicyId: '6000000002',
        paymentPolicyId: '6100000001',
        returnPolicyId: '6200000001',
      },
      pricingSummary: { price: { value: '12.00', currency: 'USD' } },
      merchantLocationKey: 'crossmart-default',
    });
  });

  it('publishes a multi-variant product as an inventory item group', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(HttpMethod.Put, `${INVENTORY}/inventory_item/SHIRT-S`, NO_CONTENT)
      .expect(HttpMethod.Put, `${INVENTORY}/inventory_item/${SHIRT_M_SKU}`, NO_CONTENT)
      .expect(HttpMethod.Put, `${INVENTORY}/inventory_item_group/${SHIRT_GROUP}`, NO_CONTENT)
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-S'),
        fixtureResponse(FIXTURES, 'offer-not-found.json', 404),
      )
      .expect(HttpMethod.Post, `${INVENTORY}/offer`, jsonResponse({ offerId: '9000000011' }, 201))
      .expect(
        HttpMethod.Get,
        offersUrl(SHIRT_M_SKU),
        fixtureResponse(FIXTURES, 'offer-not-found.json', 404),
      )
      .expect(HttpMethod.Post, `${INVENTORY}/offer`, jsonResponse({ offerId: '9000000012' }, 201))
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/offer/publish_by_inventory_item_group`,
        fixtureResponse(FIXTURES, 'offer-published.json'),
      );

    const published = await connector.publish(session, shirtDraft());

    http.assertDone();
    expect(published.externalId).toBe('110553000002');
    expect(published.variants.map((variant) => [variant.variantId, variant.externalId])).toEqual([
      [VARIANT_S, 'SHIRT-S'],
      [VARIANT_M, SHIRT_M_SKU],
    ]);
    expect(published.category).toEqual(shirtDraft().category);
    const group = requestTo(
      http.requests,
      HttpMethod.Put,
      `${INVENTORY}/inventory_item_group/${SHIRT_GROUP}`,
    );
    expect(bodyOf(group)).toEqual({
      title: 'Linen shirt',
      description: '<p>Breathable.</p>',
      imageUrls: ['https://cdn.example.com/shirt.jpg'],
      aspects: { Brand: ['Acme'] },
      variantSKUs: ['SHIRT-S', SHIRT_M_SKU],
      variesBy: { specifications: [{ name: 'Size', values: ['S', 'M'] }] },
    });
    const small = requestTo(http.requests, HttpMethod.Put, `${INVENTORY}/inventory_item/SHIRT-S`);
    expect(bodyOf(small)).toMatchObject({
      product: { aspects: { Brand: ['Acme'], Size: ['S'] }, brand: 'Acme', ean: ['4006381333931'] },
    });
    expect(bodyOf(http.requests.at(-1))).toEqual({
      inventoryItemGroupKey: SHIRT_GROUP,
      marketplaceId: 'EBAY_US',
    });
  });

  it('updates the offer it finds by SKU and keeps the SKU the variant was listed with', async () => {
    const { connector, http } = createEbayTestKit();
    const draft = mugDraft({ category: { id: '20625', name: 'Home > Mugs' } });
    draft.variants[0].externalVariantId = 'SHIRT-S';
    http
      .expect(HttpMethod.Put, `${INVENTORY}/inventory_item/SHIRT-S`, NO_CONTENT)
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-S'),
        fixtureResponse(FIXTURES, 'offers-published.json'),
      )
      .expect(HttpMethod.Put, `${INVENTORY}/offer/9000000001`, NO_CONTENT)
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/offer/9000000001/publish`,
        jsonResponse({ listingId: '110553000001' }),
      );

    const published = await connector.update(session, '110553000001', draft);

    http.assertDone();
    expect(published.externalId).toBe('110553000001');
    expect(published.variants[0].externalId).toBe('SHIRT-S');
    expect(published.category).toEqual({ id: '20625', name: 'Home > Mugs' });
    const offer = bodyOf(requestTo(http.requests, HttpMethod.Put, `${INVENTORY}/offer/9000000001`));
    expect(offer).not.toHaveProperty('sku');
    expect(offer).toMatchObject({ categoryId: '20625' });
  });

  it('ends the listing of a product that is no longer active', async () => {
    const { connector, http } = createEbayTestKit();
    const draft = mugDraft();
    draft.product.active = false;
    draft.variants[0].externalVariantId = 'SHIRT-S';
    http
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-S'),
        fixtureResponse(FIXTURES, 'offers-published.json'),
      )
      .expect(HttpMethod.Post, `${INVENTORY}/offer/9000000001/withdraw`, jsonResponse({}));

    const published = await connector.update(session, '110553000001', draft);

    http.assertDone();
    expect(published).toMatchObject({ externalId: '110553000001', active: false });
    await expect(connector.publish(session, draft)).rejects.toThrow(NOT_ACTIVE);
  });

  describe('delist', () => {
    it('withdraws a single offer, found by its SKU', async () => {
      const { connector, http } = createEbayTestKit();
      http
        .expect(
          HttpMethod.Get,
          offersUrl('SHIRT-S'),
          fixtureResponse(FIXTURES, 'offers-published.json'),
        )
        .expect(HttpMethod.Post, `${INVENTORY}/offer/9000000001/withdraw`, jsonResponse({}));

      await connector.delist(session, '110553000001', {
        productId: 'any',
        variantExternalIds: ['SHIRT-S'],
      });

      http.assertDone();
      expect(http.requests).toHaveLength(2);
    });

    it('withdraws a multi-variant listing by its group', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(
        HttpMethod.Post,
        `${INVENTORY}/offer/withdraw_by_inventory_item_group`,
        NO_CONTENT,
      );

      await connector.delist(session, '110553000002', {
        productId: '33333333-3333-4333-8333-333333333333',
        variantExternalIds: ['SHIRT-S', SHIRT_M_SKU],
      });

      http.assertDone();
      expect(bodyOf(http.requests[0])).toEqual({
        inventoryItemGroupKey: SHIRT_GROUP,
        marketplaceId: 'EBAY_US',
      });
    });

    it('refuses without the listing’s SKUs', async () => {
      const { connector } = createEbayTestKit();

      await expect(connector.delist(session, '110553000001')).rejects.toThrow(NO_REFERENCE);
    });
  });

  it('sends prices in batches of 25 SKUs, to the offers found by SKU', async () => {
    const { connector, http } = createEbayTestKit();
    const skus = Array.from({ length: 26 }, (_, index) => `SKU-${index}`);
    skus.forEach((sku, index) =>
      http.expect(
        HttpMethod.Get,
        offersUrl(sku),
        jsonResponse({ offers: [{ offerId: `offer-${index}`, sku, status: 'PUBLISHED' }] }),
      ),
    );
    http
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/bulk_update_price_quantity`,
        fixtureResponse(FIXTURES, 'bulk-price-updated.json'),
      )
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/bulk_update_price_quantity`,
        fixtureResponse(FIXTURES, 'bulk-price-updated.json'),
      );

    await connector.updatePrices(
      session,
      skus.map((sku) => ({
        externalProductId: '110553000001',
        externalVariantId: sku,
        price: '9.99',
        compareAtPrice: null,
      })),
    );

    http.assertDone();
    const batches = http.requests
      .filter((request) => request.method === HttpMethod.Post)
      .map((request) => bodyOf(request).requests as unknown[]);
    expect(batches.map((batch) => batch.length)).toEqual([25, 1]);
    expect(batches[1]).toEqual([
      {
        sku: 'SKU-25',
        offers: [{ offerId: 'offer-25', price: { value: '9.99', currency: 'USD' } }],
      },
    ]);
  });

  it('reports the prices eBay rejects, with its reason', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-S'),
        fixtureResponse(FIXTURES, 'offers-published.json'),
      )
      .expect(
        HttpMethod.Post,
        `${INVENTORY}/bulk_update_price_quantity`,
        fixtureResponse(FIXTURES, 'bulk-price-rejected.json'),
      );

    const update = {
      externalProductId: '1',
      externalVariantId: 'SHIRT-S',
      price: '0.10',
      compareAtPrice: null,
    };

    await expect(connector.updatePrices(session, [update])).rejects.toThrow(
      'eBay rejected some prices: Invalid value for price. The price must be greater than 0.99.',
    );
  });

  describe('preconditions', () => {
    it('fails without policies, before calling eBay', async () => {
      const { connector, http } = createEbayTestKit();
      const settings = ebaySettings({ listingDefaults: undefined });

      const publishing = connector.publish(session, shirtDraft({ accountSettings: settings }));

      await expect(publishing).rejects.toThrow(MISSING_POLICIES);
      expect(http.requests).toEqual([]);
    });

    it('fails without a ship-from location, and is not retried', async () => {
      const { connector } = createEbayTestKit();
      const settings = ebaySettings();
      settings.policies.fulfillment = [{ id: '6000000001', name: 'Free shipping' }];
      settings.listingDefaults = undefined;

      const error: unknown = await connector
        .publish(session, mugDraft({ accountSettings: settings }))
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ChannelError);
      expect((error as ChannelError).message).toBe(MISSING_LOCATION);
      expect((error as ChannelError).code).toBe(ChannelErrorCode.RequestRejected);
      expect((error as ChannelError).retryable).toBe(false);
    });
  });

  it('names the item specific eBay says is missing', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(HttpMethod.Put, /inventory_item\/SHIRT-S$/, NO_CONTENT)
      .expect(HttpMethod.Put, /inventory_item\/CM2/, NO_CONTENT)
      .expect(HttpMethod.Put, /inventory_item_group\//, NO_CONTENT)
      .expect(HttpMethod.Get, /\/offer\?sku=/, fixtureResponse(FIXTURES, 'offers-published.json'))
      .expect(HttpMethod.Put, /\/offer\/9000000001$/, NO_CONTENT)
      .expect(
        HttpMethod.Get,
        offersUrl(SHIRT_M_SKU),
        jsonResponse({ offers: [{ offerId: '9000000003', sku: SHIRT_M_SKU }] }),
      )
      .expect(HttpMethod.Put, /\/offer\/9000000003$/, NO_CONTENT)
      .expect(
        HttpMethod.Post,
        /publish_by_inventory_item_group$/,
        fixtureResponse(FIXTURES, 'missing-aspect.json', 400),
      );

    const error: unknown = await connector
      .update(session, '110553000002', shirtDraft())
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ChannelError);
    expect((error as ChannelError).code).toBe(ChannelErrorCode.RequestRejected);
    expect((error as ChannelError).message).toBe(
      'eBay rejected the request: The item specific Department is missing. Add Department to ' +
        'this listing, enter a valid value, and then try again.',
    );
  });

  it.each([
    [429, ChannelErrorCode.RateLimited, true],
    [503, ChannelErrorCode.ChannelUnavailable, true],
    [401, ChannelErrorCode.CredentialsRejected, false],
  ])('maps a %i answer to %s', async (status, code, retryable) => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Put, /inventory_item\//, jsonResponse({ errors: [] }, status));

    const error: unknown = await connector
      .publish(session, mugDraft({ category: { id: '1', name: 'Mugs' } }))
      .catch((caught: unknown) => caught);

    expect((error as ChannelError).code).toBe(code);
    expect((error as ChannelError).retryable).toBe(retryable);
  });
});
