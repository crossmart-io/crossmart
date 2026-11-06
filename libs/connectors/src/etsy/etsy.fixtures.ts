import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type { ListingDraft } from '../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { FakeImageFetcher } from '../sdk/images/fake-image-fetcher.js';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import { EtsyShopReader } from './account/etsy-shop.reader.js';
import { EtsyApiClient } from './api/etsy-api.client.js';
import { EtsyConnector } from './etsy.connector.js';
import { EtsyWhenMade, EtsyWhoMade } from './etsy.enums.js';
import { EtsyApp } from './etsy-app.js';
import { EtsySellingServices, EtsySyncServices } from './etsy-capabilities.js';
import type { EtsySettings } from './etsy-settings.js';
import { EtsyInventorySync } from './inventory/etsy-inventory-sync.js';
import { EtsyOAuthClient } from './oauth/etsy-oauth.client.js';
import { EtsyOrderSource } from './orders/etsy-order-source.js';
import { EtsyImageClient } from './publish/etsy-image.client.js';
import { EtsyInventoryClient } from './publish/etsy-inventory.client.js';
import { EtsyListingClient } from './publish/etsy-listing.client.js';
import { EtsyListingImages } from './publish/etsy-listing-images.js';
import { EtsyListingPublisher } from './publish/etsy-listing-publisher.js';
import { EtsyPriceUpdater } from './publish/etsy-price-updater.js';
import { EtsyTaxonomyReader } from './taxonomy/etsy-taxonomy.reader.js';

/** Fabricated responses in the shape of Etsy's Open API v3; no real shop, token or buyer. */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const TEST_KEYSTRING = 'testkeystring1234567890';
export const TEST_SHARED_SECRET = 'testsharedsecret';
export const TEST_ETSY_APP = { clientId: TEST_KEYSTRING, clientSecret: TEST_SHARED_SECRET };
export const SHOP_ID = '87654321';
export const SHOP_HANDLE = 'clayandkiln';
export const LISTING_ID = '1801234567';
export const API = 'https://api.etsy.com/v3';
export const TOKEN_URL = `${API}/public/oauth/token`;
export const ME_URL = `${API}/application/users/me`;
export const SHOP_URL = `${API}/application/shops/${SHOP_ID}`;
export const SHIPPING_PROFILES_URL = `${SHOP_URL}/shipping-profiles`;
export const PROCESSING_PROFILES_URL = `${SHOP_URL}/readiness-state-definitions?limit=100`;
export const TAXONOMY_URL = `${API}/application/seller-taxonomy/nodes`;
export const SHOP_LISTINGS_URL = `${SHOP_URL}/listings`;
export const SHOP_LISTING_URL = `${SHOP_LISTINGS_URL}/${LISTING_ID}`;
export const LISTING_URL = `${API}/application/listings/${LISTING_ID}`;
export const INVENTORY_URL = `${LISTING_URL}/inventory`;
export const IMAGES_URL = `${LISTING_URL}/images`;
export const UPLOAD_IMAGE_URL = `${SHOP_LISTING_URL}/images`;
export const RECEIPTS_URL = `${SHOP_URL}/receipts`;
export const MUG_ID = '44444444-4444-4444-8444-444444444444';
export const VARIANT_S = '11111111-1111-4111-8111-111111111111';
export const VARIANT_L = '22222222-2222-4222-8222-222222222222';

export interface EtsyTestKit {
  http: FakeHttpTransport;
  images: FakeImageFetcher;
  oauth: EtsyOAuthClient;
  connector: EtsyConnector;
  session: ChannelSession;
}

/** A session on the fixture shop, with the given settings. */
export function etsySession(settings: EtsySettings | null = etsySettings()): ChannelSession {
  return {
    connectionId: 'connection-1',
    externalAccountId: SHOP_ID,
    grantedScopes: ['listings_r', 'listings_w', 'shops_r', 'transactions_r'],
    settings,
    accessToken: () => Promise.resolve('12345678.test-access-token'),
  };
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createEtsyTestKit(app = new EtsyApp(TEST_ETSY_APP)): EtsyTestKit {
  const http = new FakeHttpTransport();
  const images = new FakeImageFetcher();
  const oauth = new EtsyOAuthClient(app, http);
  const api = new EtsyApiClient(http, app);
  const taxonomy = new EtsyTaxonomyReader(api);
  const inventory = new EtsyInventoryClient(api);
  const publisher = new EtsyListingPublisher(
    new EtsyListingClient(api),
    inventory,
    new EtsyListingImages(new EtsyImageClient(api), images),
    taxonomy,
  );
  const selling = new EtsySellingServices(publisher, new EtsyPriceUpdater(inventory), taxonomy);
  const sync = new EtsySyncServices(
    new EtsyShopReader(api),
    new EtsyOrderSource(api),
    new EtsyInventorySync(inventory),
  );
  const connector = new EtsyConnector(oauth, selling, sync);
  return { http, images, oauth, connector, session: etsySession() };
}

/** A shop with two shipping profiles (one chosen) and two processing profiles (one chosen). */
export function etsySettings(overrides: Partial<EtsySettings> = {}): EtsySettings {
  return {
    channel: ChannelType.Etsy,
    shopId: SHOP_ID,
    shopName: 'ClayAndKiln',
    userId: '12345678',
    currencyCode: 'USD',
    shopUrl: 'https://www.etsy.com/shop/ClayAndKiln',
    profiles: {
      shipping: [
        { id: '6722757781', name: 'Free US shipping' },
        { id: '6722757782', name: '6722757782' },
      ],
      processing: [
        { id: '18201076875', name: 'Ready to ship · 1-3 days' },
        { id: '18201056977', name: 'Made to order · 5–8 days' },
      ],
    },
    listingSetup: {
      whoMade: EtsyWhoMade.IDid,
      whenMade: EtsyWhenMade.MadeToOrder,
      isSupply: false,
      shippingProfileId: '6722757781',
      processingProfileId: '18201076875',
    },
    ...overrides,
  };
}

const VARIANT_DEFAULTS = {
  compareAtPrice: null,
  unitCost: null,
  barcode: null,
  tracked: true,
  weightGrams: null,
  requiresShipping: true,
  taxable: true,
  continueSellingWhenOutOfStock: false,
};

/** Small keeps its SKU; Large's has a space, so Etsy gets one derived from its id. */
function mugVariants(): ListingDraft['variants'] {
  return [
    {
      ...VARIANT_DEFAULTS,
      variantId: VARIANT_S,
      sku: 'MUG-S',
      optionValues: ['Small (8 oz)'],
      price: '28.00',
      available: 4,
    },
    {
      ...VARIANT_DEFAULTS,
      variantId: VARIANT_L,
      sku: 'MUG L',
      optionValues: ['Large'],
      price: '32.50',
      available: 3,
    },
  ];
}

/** A mug in two sizes, in the Mugs category, with materials. */
export function mugDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: MUG_ID,
    product: {
      handle: 'speckled-mug',
      title: 'Speckled stoneware mug <handmade>',
      descriptionHtml: '<p>Wheel-thrown <strong>stoneware</strong> mug.</p>',
      vendor: 'Clay & Kiln',
      productType: 'Mug',
      tags: ['stoneware mug', 'handmade', 'Stoneware Mug'],
      active: true,
      optionNames: ['Size'],
      images: [
        { url: 'https://cdn.example/mug-front.jpg', altText: 'Front' },
        { url: 'http://cdn.example/insecure.jpg', altText: null },
        { url: 'https://cdn.example/mug-back.jpg', altText: null },
      ],
    },
    variants: mugVariants(),
    category: { id: '1076', name: 'Home & Living > Kitchen & Dining > Drink & Barware > Mugs' },
    itemSpecifics: [{ name: 'materials', values: ['Stoneware', 'Glaze (lead-free)'] }],
    ...overrides,
  };
}

/** Answers the reads of `describeAccount`: the shop and its profiles. */
export function expectShopReads(http: FakeHttpTransport): void {
  http
    .expect(HttpMethod.Get, SHOP_URL, fixtureResponse(FIXTURES, 'shop.json'))
    .expect(
      HttpMethod.Get,
      SHIPPING_PROFILES_URL,
      fixtureResponse(FIXTURES, 'shipping-profiles.json'),
    )
    .expect(
      HttpMethod.Get,
      PROCESSING_PROFILES_URL,
      fixtureResponse(FIXTURES, 'processing-profiles.json'),
    );
}
