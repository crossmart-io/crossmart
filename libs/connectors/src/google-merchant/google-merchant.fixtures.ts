import type { ListingDraft, ListingDraftVariant } from '../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import { fakeChannelSession } from '../sdk/testing/fake-channel-session.js';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { GoogleAccountReader } from './account/google-account.reader.js';
import { GoogleDataSourceWriter } from './account/google-data-source.writer.js';
import { GoogleMerchantApiClient } from './api/google-merchant-api.client.js';
import { GoogleMerchantConnector } from './google-merchant.connector.js';
import { GoogleMerchantApp } from './google-merchant-app.js';
import { GoogleTargetCountry } from './google-merchant-country.js';
import type { GoogleMerchantSettings } from './google-merchant-settings.js';
import { GoogleOAuthClient } from './oauth/google-oauth.client.js';
import { GoogleListingPublisher } from './publish/google-listing-publisher.js';
import { GoogleProductInputsClient } from './publish/google-product-inputs.client.js';

/** Fabricated responses in the shape of the Merchant API; no real account, token or shopper. */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const ACCOUNT_ID = '123456789';
export const DATA_SOURCE_ID = '10462800';
export const TEST_GOOGLE_APP = {
  clientId: 'test-client.apps.googleusercontent.com',
  clientSecret: 'test-secret',
};
export const API = 'https://merchantapi.googleapis.com';
export const ACCOUNT_URL = `${API}/accounts/v1/accounts/${ACCOUNT_ID}`;
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DATA_SOURCE_QUERY = `dataSource=accounts%2F${ACCOUNT_ID}%2FdataSources%2F${DATA_SOURCE_ID}`;
export const INSERT_URL = `${API}/products/v1/accounts/${ACCOUNT_ID}/productInputs:insert?${DATA_SOURCE_QUERY}`;
export const PRODUCT_ID = '33333333-3333-4333-8333-333333333333';

export interface GoogleTestKit {
  http: FakeHttpTransport;
  connector: GoogleMerchantConnector;
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createGoogleTestKit(app = new GoogleMerchantApp(TEST_GOOGLE_APP)): GoogleTestKit {
  const http = new FakeHttpTransport();
  const api = new GoogleMerchantApiClient(http);
  const connector = new GoogleMerchantConnector(
    new GoogleOAuthClient(app, http),
    new GoogleAccountReader(api),
    new GoogleDataSourceWriter(api),
    new GoogleListingPublisher(new GoogleProductInputsClient(api)),
  );
  return { http, connector };
}

/** A German account with its listing setup saved. */
export function googleSettings(
  overrides: Partial<GoogleMerchantSettings> = {},
): GoogleMerchantSettings {
  return {
    channel: ChannelType.GoogleMerchant,
    accountId: ACCOUNT_ID,
    accountName: 'Acme Goods',
    homepageUri: 'https://acme.example',
    homepageClaimed: true,
    country: GoogleTargetCountry.DE,
    currencyCode: 'EUR',
    contentLanguage: 'de',
    listingSetup: {
      country: GoogleTargetCountry.DE,
      productUrlTemplate: 'https://acme.example/products/{handle}',
      dataSourceId: DATA_SOURCE_ID,
    },
    ...overrides,
  };
}

export function googleSession(
  settings: GoogleMerchantSettings | null = googleSettings(),
): ChannelSession {
  return { ...fakeChannelSession(ACCOUNT_ID), settings };
}

const VARIANT_DEFAULTS = {
  externalVariantId: null,
  compareAtPrice: null,
  unitCost: null,
  tracked: true,
  continueSellingWhenOutOfStock: false,
  weightGrams: null,
  requiresShipping: true,
  taxable: true,
};

/** The shirt's two sizes: S on sale with a GTIN, M out of stock with a SKU Google cannot key. */
function shirtVariants(): ListingDraftVariant[] {
  return [
    {
      ...VARIANT_DEFAULTS,
      variantId: '44444444-4444-4444-8444-444444444441',
      sku: 'SHIRT-S',
      barcode: '4006381333931',
      optionValues: ['S', 'Blue'],
      price: '39.90',
      compareAtPrice: '49.90',
      available: 4,
      weightGrams: 250,
    },
    {
      ...VARIANT_DEFAULTS,
      variantId: '44444444-4444-4444-8444-444444444442',
      sku: 'shirt m/blue',
      barcode: 'ABC',
      optionValues: ['M', 'Blue'],
      price: '39.90',
      available: 0,
    },
  ];
}

/** A linen shirt in two sizes and one colour: a grouped listing. */
export function shirtDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: PRODUCT_ID,
    product: {
      handle: 'linen shirt',
      title: 'Linen shirt',
      descriptionHtml: '<p>Breathable <strong>linen</strong>.</p>',
      vendor: 'Acme',
      productType: 'Shirts',
      tags: [],
      active: true,
      optionNames: ['Size', 'Colour'],
      images: [
        { url: 'http://insecure.example/shirt.jpg', altText: null },
        { url: 'https://cdn.example/shirt.jpg', altText: null },
        { url: 'https://cdn.example/shirt-back.jpg', altText: null },
      ],
    },
    variants: shirtVariants(),
    accountSettings: googleSettings(),
    ...overrides,
  };
}
