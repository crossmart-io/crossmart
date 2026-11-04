import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES } from '../ebay.fixtures.js';

const API = 'https://api.sandbox.ebay.com';
const LOCATION_URL = `${API}/sell/inventory/v1/location/crossmart-default`;
const OPT_IN_URL = `${API}/sell/account/v1/program/opt_in`;
const NO_CONTENT = { status: 204, headers: {}, body: '' };
const session = fakeChannelSession(ACCOUNT_ID);
const SHIP_FROM = { postalCode: '95125', country: 'US', city: 'San Jose' };

describe('eBay account setup', () => {
  describe('saveShipFromLocation', () => {
    it('creates the warehouse location under Crossmart’s key', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(HttpMethod.Post, LOCATION_URL, NO_CONTENT);

      const key = await connector.saveShipFromLocation(session, SHIP_FROM);

      http.assertDone();
      expect(key).toBe('crossmart-default');
      expect(JSON.parse(http.requests[0].body ?? '')).toEqual({
        location: { address: { postalCode: '95125', country: 'US', city: 'San Jose' } },
        locationTypes: ['WAREHOUSE'],
        name: 'Crossmart ship-from location',
      });
    });

    it.each([
      ['a conflict', jsonResponse({}, 409)],
      ['an "already exists" error', fixtureResponse(FIXTURES, 'location-exists.json', 400)],
    ])('updates the address when the location exists (%s)', async (_case, existsResponse) => {
      const { connector, http } = createEbayTestKit();
      http
        .expect(HttpMethod.Post, LOCATION_URL, existsResponse)
        .expect(HttpMethod.Post, `${LOCATION_URL}/update_location_details`, NO_CONTENT);

      const key = await connector.saveShipFromLocation(session, { ...SHIP_FROM, city: null });

      http.assertDone();
      expect(key).toBe('crossmart-default');
      expect(JSON.parse(http.requests[1].body ?? '')).toEqual({
        location: { address: { postalCode: '95125', country: 'US' } },
        name: 'Crossmart ship-from location',
      });
    });

    it('reports an address eBay rejects', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(
        HttpMethod.Post,
        LOCATION_URL,
        jsonResponse({ errors: [{ errorId: 25802, message: 'Invalid postal code.' }] }, 400),
      );

      await expect(connector.saveShipFromLocation(session, SHIP_FROM)).rejects.toMatchObject({
        code: ChannelErrorCode.RequestRejected,
        message: 'eBay rejected the request: Invalid postal code.',
      });
    });
  });

  describe('optInToBusinessPolicies', () => {
    it('opts in to selling policy management', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(HttpMethod.Post, OPT_IN_URL, jsonResponse({}));

      await connector.optInToBusinessPolicies(session);

      http.assertDone();
      expect(JSON.parse(http.requests[0].body ?? '')).toEqual({
        programType: 'SELLING_POLICY_MANAGEMENT',
      });
    });

    it('accepts an account that is already opted in', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(
        HttpMethod.Post,
        OPT_IN_URL,
        fixtureResponse(FIXTURES, 'opt-in-already.json', 409),
      );

      await expect(connector.optInToBusinessPolicies(session)).resolves.toBeUndefined();
    });
  });

  describe('suggestCategories', () => {
    it('reads the tree once per marketplace and names each category with its path', async () => {
      const { connector, http } = createEbayTestKit();
      http
        .expect(
          HttpMethod.Get,
          /get_default_category_tree_id\?marketplace_id=EBAY_US$/,
          fixtureResponse(FIXTURES, 'category-tree.json'),
        )
        .expect(
          HttpMethod.Get,
          /category_tree\/0\/get_category_suggestions\?q=linen\+shirt$/,
          fixtureResponse(FIXTURES, 'category-suggestions.json'),
        )
        .expect(HttpMethod.Get, /get_category_suggestions\?q=nothing$/, NO_CONTENT);

      const categories = await connector.suggestCategories(session, ' linen shirt ');
      const none = await connector.suggestCategories(session, 'nothing');

      http.assertDone();
      expect(categories).toEqual([
        {
          id: '57990',
          name: "Clothing, Shoes & Accessories > Men's Clothing > Casual Button-Down Shirts",
        },
        { id: '185100', name: 'Women > Shirts & Tops' },
      ]);
      expect(none).toEqual([]);
      expect(await connector.suggestCategories(session, '  ')).toEqual([]);
    });
  });
});
