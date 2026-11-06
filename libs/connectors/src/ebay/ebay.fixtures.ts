import { EbayEnvironment } from '@crossmart/common';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { EbayBusinessPoliciesOptIn } from './account/ebay-business-policies.opt-in.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayBusinessPoliciesWriter } from './account/ebay-business-policies.writer.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayLocationWriter } from './account/ebay-location.writer.js';
import { EbayApiClient } from './api/ebay-api.client.js';
import { EbayConnector } from './ebay.connector.js';
import { EbayApp } from './ebay-app.js';
import { EbayAccountServices, EbaySellingServices, EbaySyncServices } from './ebay-capabilities.js';
import { EbayInventorySync } from './inventory/ebay-inventory-sync.js';
import { EbayOrderSource } from './orders/ebay-order-source.js';
import { EbayNotificationVerifier } from './notifications/ebay-notification.verifier.js';
import { EbayPublicKeyClient } from './notifications/ebay-public-key.client.js';
import { EbayApplicationTokens } from './oauth/ebay-application-tokens.js';
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';
import { EbayInventoryClient } from './publish/ebay-inventory.client.js';
import { EbayListingPublisher } from './publish/ebay-listing-publisher.js';
import { EbayOfferClient } from './publish/ebay-offer.client.js';
import { EbayPriceUpdater } from './publish/ebay-price-updater.js';
import { EbayListingCategory } from './publish/ebay-listing-category.js';
import { EbayCategoryAspectsReader } from './taxonomy/ebay-category-aspects.reader.js';
import { EbayTaxonomyReader } from './taxonomy/ebay-taxonomy.reader.js';

/** Fabricated responses in the shape of eBay's REST APIs; no real account, token or buyer data. */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const TEST_CLIENT_ID = 'test-app-id';
export const TEST_CLIENT_SECRET = 'test-cert-id';
export const TEST_RU_NAME = 'Test_Seller-TestApp-SBX-abcdef';
export const USER_ID = 'nY4uWx2bQ1e';
export const ACCOUNT_ID = `${USER_ID}:EBAY_US`;
export const TOKEN_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
export const USER_URL = 'https://apiz.sandbox.ebay.com/commerce/identity/v1/user/';
export const PUBLIC_KEY_URL = 'https://api.sandbox.ebay.com/commerce/notification/v1/public_key/';
const POLICY_BASE = 'https://api.sandbox.ebay.com/sell/account/v1';
export const POLICY_URLS = {
  fulfillment: `${POLICY_BASE}/fulfillment_policy?marketplace_id=EBAY_US`,
  payment: `${POLICY_BASE}/payment_policy?marketplace_id=EBAY_US`,
  return: `${POLICY_BASE}/return_policy?marketplace_id=EBAY_US`,
};

export const TEST_EBAY_APP = {
  clientId: TEST_CLIENT_ID,
  clientSecret: TEST_CLIENT_SECRET,
  ruName: TEST_RU_NAME,
  environment: EbayEnvironment.Sandbox,
};

export interface EbayTestKit {
  http: FakeHttpTransport;
  oauth: EbayOAuthClient;
  connector: EbayConnector;
  publicKeys: EbayPublicKeyClient;
  notifications: EbayNotificationVerifier;
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createEbayTestKit(app = new EbayApp(TEST_EBAY_APP)): EbayTestKit {
  const http = new FakeHttpTransport();
  const oauth = new EbayOAuthClient(app, http);
  const api = new EbayApiClient(http);
  const policies = new EbayBusinessPoliciesReader(app, api);
  const account = new EbayAccountServices(
    new EbayIdentityReader(app, api),
    policies,
    new EbayBusinessPoliciesWriter(app, api, policies, new EbayBusinessPoliciesOptIn(app, api)),
    new EbayLocationWriter(app, api),
  );
  const offers = new EbayOfferClient(app, api);
  const taxonomy = new EbayTaxonomyReader(app, api);
  const aspects = new EbayCategoryAspectsReader(taxonomy, api);
  const publisher = new EbayListingPublisher(
    app,
    new EbayInventoryClient(app, api),
    offers,
    new EbayListingCategory(taxonomy, aspects),
  );
  const selling = new EbaySellingServices(
    publisher,
    new EbayPriceUpdater(app, api, offers),
    taxonomy,
    aspects,
  );
  const sync = new EbaySyncServices(
    new EbayOrderSource(app, api),
    new EbayInventorySync(app, api, offers),
  );
  const connector = new EbayConnector(oauth, account, selling, sync);
  const publicKeys = new EbayPublicKeyClient(app, api, new EbayApplicationTokens(oauth));
  const notifications = new EbayNotificationVerifier(publicKeys);
  return { http, oauth, connector, publicKeys, notifications };
}

/** Answers the three policy reads with the recorded lists. */
export function expectPolicies(http: FakeHttpTransport): void {
  http
    .expect(
      HttpMethod.Get,
      POLICY_URLS.fulfillment,
      fixtureResponse(FIXTURES, 'fulfillment-policies.json'),
    )
    .expect(HttpMethod.Get, POLICY_URLS.payment, fixtureResponse(FIXTURES, 'payment-policies.json'))
    .expect(HttpMethod.Get, POLICY_URLS.return, fixtureResponse(FIXTURES, 'return-policies.json'));
}
