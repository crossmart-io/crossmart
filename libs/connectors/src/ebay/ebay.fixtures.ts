import { EbayEnvironment } from '@crossmart/common';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayApiClient } from './api/ebay-api.client.js';
import { EbayConnector } from './ebay.connector.js';
import { EbayApp } from './ebay-app.js';
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';

/** Fabricated responses in the shape of eBay's REST APIs; no real account, token or buyer data. */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const TEST_CLIENT_ID = 'test-app-id';
export const TEST_CLIENT_SECRET = 'test-cert-id';
export const TEST_RU_NAME = 'Test_Seller-TestApp-SBX-abcdef';
export const USER_ID = 'nY4uWx2bQ1e';
export const ACCOUNT_ID = `${USER_ID}:EBAY_US`;
export const TOKEN_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
export const USER_URL = 'https://apiz.sandbox.ebay.com/commerce/identity/v1/user/';
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
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createEbayTestKit(app = new EbayApp(TEST_EBAY_APP)): EbayTestKit {
  const http = new FakeHttpTransport();
  const oauth = new EbayOAuthClient(app, http);
  const api = new EbayApiClient(http);
  const connector = new EbayConnector(
    oauth,
    new EbayIdentityReader(app, api),
    new EbayBusinessPoliciesReader(app, api),
  );
  return { http, oauth, connector };
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
