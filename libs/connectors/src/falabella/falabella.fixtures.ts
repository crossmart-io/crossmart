import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type { ListingDraft } from '../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import type { HttpResponse } from '../sdk/http/http-transport.js';
import { ItemCondition } from '../sdk/listings/item-condition.enum.js';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { loadFixture } from '../sdk/testing/fixtures.js';
import { RecordingSleeper } from '../sdk/time/sleeper.js';
import { FalabellaAccountVerifier } from './account/falabella-account.verifier.js';
import { FalabellaApiClient } from './api/falabella-api.client.js';
import { parseFalabellaXml } from './api/falabella-xml.js';
import { FalabellaConnector } from './falabella.connector.js';
import { FalabellaAction, FalabellaCountry, FalabellaCredentialField } from './falabella.enums.js';
import { FalabellaSellingServices, FalabellaSyncServices } from './falabella-capabilities.js';
import type { FalabellaSettings } from './falabella-settings.js';
import { FalabellaFeedClient } from './feeds/falabella-feed.client.js';
import { FalabellaInventorySync } from './inventory/falabella-inventory-sync.js';
import { FalabellaOrderSource } from './orders/falabella-order-source.js';
import { FalabellaListingPublisher } from './publish/falabella-listing-publisher.js';
import { FalabellaPriceUpdater } from './publish/falabella-price-updater.js';
import { FalabellaProductLookup } from './publish/falabella-product-lookup.js';
import { FalabellaTaxonomyReader } from './taxonomy/falabella-taxonomy.reader.js';

/**
 * Responses copied from the examples in Falabella's Seller Center API reference
 * (developers.falabella.com), with ids aligned where a test joins two of them. No real seller,
 * key or buyer.
 */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const SELLER_ID = 'SC478FA';
export const USER_ID = 'seller@example.com';
export const API_KEY = 'b1bdb357ced10fe4e9a69840cdd4f0e9c03d77fe';
export const SHOE_ID = '44444444-4444-4444-8444-444444444444';
export const WHITE_ID = '11111111-1111-4111-8111-111111111111';
export const BLACK_ID = '22222222-2222-4222-8222-222222222222';
export const DERIVED_BLACK_SKU = 'CM22222222222242228222222222222222';

const XML_CONTENT_TYPE = 'application/xml';

export interface FalabellaTestKit {
  http: FakeHttpTransport;
  sleeper: RecordingSleeper;
  connector: FalabellaConnector;
  session: ChannelSession;
}

/** A recorded XML response. */
export function xmlFixture(name: string, status = 200): HttpResponse {
  return {
    status,
    headers: { 'content-type': XML_CONTENT_TYPE },
    body: loadFixture(FIXTURES, name),
  };
}

/** Matches a call by its action, which sorts first in every signed query. */
export function actionUrl(action: FalabellaAction): RegExp {
  return new RegExp(`^https://sellercenter-api\\.falabella\\.com/\\?Action=${action}&`);
}

/** A sent request's XML body, as an object, for assertions. */
export function sentXml(http: FakeHttpTransport, index: number): unknown {
  return parseFalabellaXml(http.requests[index]?.body ?? '');
}

/** A query parameter of a sent request. */
export function sentParam(http: FakeHttpTransport, index: number, name: string): string | null {
  return new URL(http.requests[index]?.url ?? '').searchParams.get(name);
}

export function falabellaSettings(overrides: Partial<FalabellaSettings> = {}): FalabellaSettings {
  return {
    channel: ChannelType.Falabella,
    country: FalabellaCountry.Chile,
    sellerId: SELLER_ID,
    userId: USER_ID,
    currencyCode: 'CLP',
    ...overrides,
  };
}

export function falabellaSession(
  settings: FalabellaSettings | null = falabellaSettings(),
): ChannelSession {
  return {
    connectionId: 'connection-1',
    externalAccountId: `${SELLER_ID}:${FalabellaCountry.Chile}`,
    grantedScopes: [],
    settings,
    accessToken: () => Promise.resolve(API_KEY),
  };
}

/** What a merchant pastes for the fixture account. */
export function pastedCredentials(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    [FalabellaCredentialField.SellerId]: SELLER_ID,
    [FalabellaCredentialField.UserId]: USER_ID,
    [FalabellaCredentialField.ApiKey]: API_KEY,
    [FalabellaCredentialField.Country]: FalabellaCountry.Chile,
    ...overrides,
  };
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createFalabellaTestKit(): FalabellaTestKit {
  const http = new FakeHttpTransport();
  const sleeper = new RecordingSleeper();
  const api = new FalabellaApiClient(http);
  const feeds = new FalabellaFeedClient(api, sleeper);
  const taxonomy = new FalabellaTaxonomyReader(api);
  const lookup = new FalabellaProductLookup(api);
  const selling = new FalabellaSellingServices(
    new FalabellaListingPublisher(taxonomy, feeds, lookup),
    new FalabellaPriceUpdater(feeds),
    taxonomy,
  );
  const sync = new FalabellaSyncServices(
    new FalabellaAccountVerifier(api),
    new FalabellaOrderSource(api),
    new FalabellaInventorySync(feeds, lookup),
  );
  const connector = new FalabellaConnector(selling, sync);
  return { http, sleeper, connector, session: falabellaSession() };
}

const VARIANT_DEFAULTS = {
  compareAtPrice: null,
  unitCost: null,
  tracked: true,
  requiresShipping: true,
  taxable: true,
  continueSellingWhenOutOfStock: false,
};

/**
 * White keeps its SKU; black's has a space, so Falabella gets one derived from its id. Only
 * white has a weight.
 */
function shoeVariants(): ListingDraft['variants'] {
  return [
    {
      ...VARIANT_DEFAULTS,
      variantId: WHITE_ID,
      sku: 'SHOE-WHITE',
      barcode: '4066749430450',
      optionValues: ['Blanco'],
      price: '59990',
      available: 36,
      weightGrams: 900,
    },
    {
      ...VARIANT_DEFAULTS,
      variantId: BLACK_ID,
      sku: 'SHOE BLACK',
      barcode: null,
      optionValues: ['Negro'],
      price: '59990',
      available: -2,
      weightGrams: null,
    },
  ];
}

/** Sneakers in white and black, in a category that groups variations. */
export function shoeDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: SHOE_ID,
    product: {
      handle: 'zapatillas-running',
      title: 'Zapatillas running <livianas>',
      descriptionHtml: '<p>Zapatillas <b>livianas</b> para correr.</p>',
      vendor: 'EPATE',
      productType: 'Zapatillas',
      tags: [],
      active: true,
      optionNames: ['Color básico variant'],
      images: [
        { url: 'https://cdn.example/shoe-front.jpg', altText: null },
        { url: 'http://cdn.example/insecure.jpg', altText: null },
      ],
    },
    variants: shoeVariants(),
    category: { id: '811', name: 'Calzado > Zapatillas' },
    itemSpecifics: [
      { name: 'Género', values: ['Mujer'] },
      { name: 'PackageHeight', values: ['10'] },
      { name: 'Package width (cm)', values: ['12'] },
      { name: 'package length (cm)', values: ['30'] },
      { name: 'Package weight (kg)', values: ['1'] },
    ],
    condition: ItemCondition.UsedGood,
    ...overrides,
  };
}

/** Answers one feed write and its status. */
export function expectFeed(
  http: FakeHttpTransport,
  action: FalabellaAction,
  accepted: string,
  status = 'feed-status-finished.xml',
): void {
  http
    .expect(HttpMethod.Post, actionUrl(action), xmlFixture(accepted))
    .expect(HttpMethod.Get, actionUrl(FalabellaAction.FeedStatus), xmlFixture(status));
}
