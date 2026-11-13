import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type { ListingDraft, ListingDraftVariant } from '../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { loadFixture } from '../sdk/testing/fixtures.js';
import { MercadoLibreUserReader } from './account/mercadolibre-user.reader.js';
import { MercadoLibreApiClient } from './api/mercadolibre-api.client.js';
import { MercadoLibreInventorySync } from './inventory/mercadolibre-inventory-sync.js';
import { MercadoLibreConnector } from './mercadolibre.connector.js';
import { MercadoLibreApp } from './mercadolibre-app.js';
import {
  MercadoLibreSellingServices,
  MercadoLibreSyncServices,
} from './mercadolibre-capabilities.js';
import type { MercadoLibreSettings } from './mercadolibre-settings.js';
import { MercadoLibreSiteId } from './mercadolibre-site.js';
import { MercadoLibreNotificationParser } from './notifications/mercadolibre-notification.parser.js';
import { MercadoLibreOAuthClient } from './oauth/mercadolibre-oauth.client.js';
import { MercadoLibreOrderSource } from './orders/mercadolibre-order-source.js';
import { MercadoLibreItemClient } from './publish/mercadolibre-item.client.js';
import { MercadoLibreItemLifecycle } from './publish/mercadolibre-item-lifecycle.js';
import { MercadoLibreListingWriters } from './publish/mercadolibre-listing-writers.js';
import { MercadoLibreListingPublisher } from './publish/mercadolibre-listing-publisher.js';
import { MercadoLibrePriceUpdater } from './publish/mercadolibre-price-updater.js';
import { MercadoLibreSingleItemWriter } from './publish/mercadolibre-single-item.writer.js';
import { MercadoLibreUserProductWriter } from './publish/mercadolibre-user-product.writer.js';
import { MercadoLibreCategoryReader } from './taxonomy/mercadolibre-category.reader.js';
import { MercadoLibreCategoryAttributesReader } from './taxonomy/mercadolibre-category-attributes.reader.js';

/**
 * Responses in the shapes of the examples in Mercado Libre's developer guides (their JSON
 * syntax slips fixed); the users, items and orders are the guides' test data.
 */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
/** The `application_id` of the guide's `orders_v2` notification. */
export const TEST_APP_ID = '5503910054141466';
export const TEST_APP = { clientId: TEST_APP_ID, clientSecret: 'test-secret-key' };
/** The test user of `user-me.json`, on Mercado Libre Argentina. */
export const USER_ID = '202593498';
export const API = 'https://api.mercadolibre.com';
export const TOKEN_URL = `${API}/oauth/token`;
export const ME_URL = `${API}/users/me`;
export const ITEMS_URL = `${API}/items`;
export const ACCESS_TOKEN = 'APP_USR-123456-090515-8cc4448aac10d5105474e1351-1234567';
export const CATEGORY = { id: 'MLA1055', name: 'Celulares y Teléfonos > Celulares y Smartphones' };
export const CATEGORY_URL = `${API}/categories/MLA1055`;
export const ATTRIBUTES_URL = `${CATEGORY_URL}/attributes`;
export const PRODUCT_ID = '44444444-4444-4444-8444-444444444444';
export const VARIANT_BLACK = '11111111-1111-4111-8111-111111111111';
export const VARIANT_BROWN = '22222222-2222-4222-8222-222222222222';

export function itemUrl(itemId: string): string {
  return `${ITEMS_URL}/${itemId}`;
}

export function descriptionUrl(itemId: string): string {
  return `${itemUrl(itemId)}/description`;
}

/** A fixture parsed, to change a field or two for a test. */
export function fixtureJson<TValue = Record<string, unknown>>(name: string): TValue {
  return JSON.parse(loadFixture(FIXTURES, name)) as TValue;
}

export function mercadoLibreSettings(
  overrides: Partial<MercadoLibreSettings> = {},
): MercadoLibreSettings {
  return {
    channel: ChannelType.MercadoLibre,
    userId: USER_ID,
    nickname: 'TETE2870021',
    siteId: MercadoLibreSiteId.Argentina,
    currencyCode: 'ARS',
    permalink: 'http://perfil.mercadolibre.com.ar/TETE2870021',
    userProductSeller: false,
    ...overrides,
  };
}

export function mercadoLibreSession(
  settings: MercadoLibreSettings | null = mercadoLibreSettings(),
): ChannelSession {
  return {
    connectionId: 'connection-1',
    externalAccountId: USER_ID,
    grantedScopes: ['offline_access', 'read', 'write'],
    settings,
    accessToken: () => Promise.resolve(ACCESS_TOKEN),
  };
}

export function draftVariant(overrides: Partial<ListingDraftVariant> = {}): ListingDraftVariant {
  return {
    variantId: VARIANT_BLACK,
    sku: 'CEL-NEGRO',
    barcode: '4006381333931',
    optionValues: ['Negro'],
    price: '100.00',
    compareAtPrice: null,
    tracked: true,
    available: 4,
    weightGrams: null,
    requiresShipping: true,
    taxable: true,
    continueSellingWhenOutOfStock: false,
    unitCost: null,
    ...overrides,
  };
}

/** A phone in black and brown, priced alike, as the Variations guide lists it. */
export function listingDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: PRODUCT_ID,
    product: {
      handle: 'celular-de-prueba',
      title: 'Item de testeo',
      descriptionHtml: '<p>Celular <strong>libre</strong>.</p>',
      vendor: 'Eiffel',
      productType: null,
      tags: [],
      active: true,
      optionNames: ['Color'],
      images: [{ url: 'https://cdn.example.com/celular.jpg', altText: null }],
    },
    variants: [
      draftVariant(),
      draftVariant({
        variantId: VARIANT_BROWN,
        sku: 'CEL-MARRON',
        barcode: '9780471117094',
        optionValues: ['Marrón'],
      }),
    ],
    category: CATEGORY,
    ...overrides,
  };
}

export interface MercadoLibreTestKit {
  http: FakeHttpTransport;
  oauth: MercadoLibreOAuthClient;
  connector: MercadoLibreConnector;
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createMercadoLibreTestKit(
  app = new MercadoLibreApp(TEST_APP),
): MercadoLibreTestKit {
  const http = new FakeHttpTransport();
  const oauth = new MercadoLibreOAuthClient(app, http);
  const api = new MercadoLibreApiClient(http);
  const items = new MercadoLibreItemClient(api);
  const lifecycle = new MercadoLibreItemLifecycle(items);
  const categories = new MercadoLibreCategoryReader(api);
  const attributes = new MercadoLibreCategoryAttributesReader(api);
  const publisher = new MercadoLibreListingPublisher(
    categories,
    attributes,
    new MercadoLibreListingWriters(
      new MercadoLibreSingleItemWriter(items, lifecycle),
      new MercadoLibreUserProductWriter(items, lifecycle),
    ),
    lifecycle,
  );
  const selling = new MercadoLibreSellingServices(
    publisher,
    new MercadoLibrePriceUpdater(items, lifecycle),
    categories,
    attributes,
  );
  const sync = new MercadoLibreSyncServices(
    new MercadoLibreUserReader(api),
    new MercadoLibreOrderSource(api),
    new MercadoLibreInventorySync(items, lifecycle),
    new MercadoLibreNotificationParser(app),
  );
  return { http, oauth, connector: new MercadoLibreConnector(app, oauth, selling, sync) };
}
