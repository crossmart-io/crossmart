import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import {
  ACCOUNT_ID,
  API,
  createGoogleTestKit,
  DATA_SOURCE_QUERY,
  FIXTURES,
  googleSession,
  googleSettings,
  INSERT_URL,
  PRODUCT_ID,
  shirtDraft,
} from '../google-merchant.fixtures.js';
import { GoogleTargetCountry } from '../google-merchant-country.js';
import { NO_IMAGE, NO_SETUP, NOT_ACTIVE } from './google-listing-publisher.js';
import { productInputId } from './google-product-inputs.client.js';

const FEED = {
  accountId: ACCOUNT_ID,
  dataSourceId: '10462800',
  contentLanguage: 'de',
  feedLabel: 'DE',
};
const DERIVED_M = '44444444-4444-4444-8444-444444444442';

function inputUrl(offerId: string, query = DATA_SOURCE_QUERY): string {
  return `${API}/products/v1/accounts/${ACCOUNT_ID}/productInputs/${productInputId(FEED, offerId)}?${query}`;
}

function bodies(requests: readonly HttpRequest[]): Record<string, unknown>[] {
  return requests.map((request) => JSON.parse(request.body ?? '{}') as Record<string, unknown>);
}

describe('GoogleListingPublisher', () => {
  it('uses the setup country for the language and currency, not the account business country', async () => {
    const { connector, http } = createGoogleTestKit();
    const product = fixtureResponse(FIXTURES, 'product-input.json');
    http.expect(HttpMethod.Post, INSERT_URL, product).expect(HttpMethod.Post, INSERT_URL, product);
    // A reconnect rereads the account: an Israeli business keeps its German listing setup.
    const accountSettings = googleSettings({
      country: GoogleTargetCountry.IL,
      currencyCode: 'ILS',
      contentLanguage: 'he',
    });

    await connector.publish(googleSession(accountSettings), shirtDraft({ accountSettings }));

    const [small] = bodies(http.requests);
    expect(small).toMatchObject({
      contentLanguage: 'de',
      feedLabel: 'DE',
      productAttributes: { price: { currencyCode: 'EUR' } },
    });
  });

  it('publishes each variant as an offer, grouped, priced and linked to the product page', async () => {
    const { connector, http } = createGoogleTestKit();
    const product = fixtureResponse(FIXTURES, 'product-input.json');
    http.expect(HttpMethod.Post, INSERT_URL, product).expect(HttpMethod.Post, INSERT_URL, product);

    const published = await connector.publish(googleSession(), shirtDraft());

    http.assertDone();
    expect(published).toEqual({
      externalId: PRODUCT_ID,
      externalUrl: null,
      active: true,
      variants: [
        {
          variantId: '44444444-4444-4444-8444-444444444441',
          externalId: 'SHIRT-S',
          externalInventoryId: null,
        },
        { variantId: DERIVED_M, externalId: DERIVED_M, externalInventoryId: null },
      ],
    });
    const [small, medium] = bodies(http.requests);
    expect(small).toEqual({
      offerId: 'SHIRT-S',
      contentLanguage: 'de',
      feedLabel: 'DE',
      productAttributes: {
        title: 'Linen shirt',
        description: 'Breathable linen.',
        link: 'https://acme.example/products/linen%20shirt',
        imageLink: 'https://cdn.example/shirt.jpg',
        additionalImageLinks: ['https://cdn.example/shirt-back.jpg'],
        availability: 'IN_STOCK',
        condition: 'NEW',
        price: { amountMicros: '49900000', currencyCode: 'EUR' },
        salePrice: { amountMicros: '39900000', currencyCode: 'EUR' },
        brand: 'Acme',
        gtins: ['4006381333931'],
        itemGroupId: PRODUCT_ID,
        color: 'Blue',
        size: 'S',
        shippingWeight: { value: 250, unit: 'g' },
      },
    });
    expect(medium).toMatchObject({
      offerId: DERIVED_M,
      productAttributes: {
        availability: 'OUT_OF_STOCK',
        identifierExists: false,
        price: { amountMicros: '39900000', currencyCode: 'EUR' },
        size: 'M',
      },
    });
    expect(medium.productAttributes).not.toHaveProperty('salePrice');
  });

  it('refuses before calling Google without a listing setup, a photo, or an active product', async () => {
    const { connector, http } = createGoogleTestKit();
    const noSetup = shirtDraft({ accountSettings: googleSettings({ listingSetup: undefined }) });
    const noPhoto = shirtDraft();
    noPhoto.product.images = [{ url: 'http://insecure.example/a.jpg', altText: null }];
    const inactive = shirtDraft();
    inactive.product.active = false;

    await expect(connector.publish(googleSession(), noSetup)).rejects.toThrow(NO_SETUP);
    await expect(connector.publish(googleSession(), noPhoto)).rejects.toThrow(NO_IMAGE);
    await expect(connector.publish(googleSession(), inactive)).rejects.toThrow(NOT_ACTIVE);
    expect(http.requests).toEqual([]);
  });

  it('keeps the offer ids a listing was published with', async () => {
    const { connector, http } = createGoogleTestKit();
    const product = fixtureResponse(FIXTURES, 'product-input.json');
    http.expect(HttpMethod.Post, INSERT_URL, product).expect(HttpMethod.Post, INSERT_URL, product);
    const draft = shirtDraft();
    draft.variants[0].externalVariantId = 'OLD-SKU';

    const published = await connector.update(googleSession(), PRODUCT_ID, draft);

    expect(published.variants[0].externalId).toBe('OLD-SKU');
  });

  it('removes the offers of a product no longer active, treating missing ones as gone', async () => {
    const { connector, http } = createGoogleTestKit();
    http
      .expect(HttpMethod.Delete, inputUrl('SHIRT-S'), jsonResponse({}))
      .expect(HttpMethod.Delete, inputUrl(DERIVED_M), jsonResponse({ error: { code: 404 } }, 404));
    const draft = shirtDraft();
    draft.product.active = false;

    const published = await connector.update(googleSession(), PRODUCT_ID, draft);

    http.assertDone();
    expect(published.active).toBe(false);
  });

  it('patches only prices, removing a sale price that ended', async () => {
    const { connector, http } = createGoogleTestKit();
    const mask = `${DATA_SOURCE_QUERY}&updateMask=productAttributes.price%2CproductAttributes.salePrice`;
    http.expect(HttpMethod.Patch, inputUrl('SHIRT-S', mask), jsonResponse({}));

    await connector.updatePrices(googleSession(), [
      {
        externalProductId: PRODUCT_ID,
        externalVariantId: 'SHIRT-S',
        price: '35',
        compareAtPrice: null,
      },
    ]);

    http.assertDone();
    expect(bodies(http.requests)).toEqual([
      { productAttributes: { price: { amountMicros: '35000000', currencyCode: 'EUR' } } },
    ]);
  });

  it('carries Google’s reason when it rejects an offer', async () => {
    const { connector, http } = createGoogleTestKit();
    const rejected = fixtureResponse(FIXTURES, 'invalid-argument.json', 400);
    http
      .expect(HttpMethod.Post, INSERT_URL, rejected)
      .expect(HttpMethod.Post, INSERT_URL, rejected);

    await expect(connector.publish(googleSession(), shirtDraft())).rejects.toThrow(
      'The link must be a valid URL',
    );
  });
});
