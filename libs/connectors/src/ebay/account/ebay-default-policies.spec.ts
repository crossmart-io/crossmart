import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES, POLICY_URLS, USER_ID } from '../ebay.fixtures.js';

const ACCOUNT_API = 'https://api.sandbox.ebay.com/sell/account/v1';
const CREATE_URLS = {
  fulfillment: `${ACCOUNT_API}/fulfillment_policy`,
  payment: `${ACCOUNT_API}/payment_policy`,
  return: `${ACCOUNT_API}/return_policy`,
};
const OPT_IN_URL = `${ACCOUNT_API}/program/opt_in`;
const OPTED_IN = { currencyCode: 'USD', businessPoliciesEnabled: true };
const CREATED_IDS = { fulfillment: '6100000001', payment: '6200000001', return: '6300000001' };
const session = fakeChannelSession(ACCOUNT_ID);

function kit() {
  const { connector, http } = createEbayTestKit();
  const expectCreated = (): void => {
    http
      .expect(
        HttpMethod.Post,
        CREATE_URLS.fulfillment,
        fixtureResponse(FIXTURES, 'fulfillment-policy-created.json', 201),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.payment,
        fixtureResponse(FIXTURES, 'payment-policy-created.json', 201),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.return,
        fixtureResponse(FIXTURES, 'return-policy-created.json', 201),
      );
  };
  return { connector, http, expectCreated };
}

describe('eBay default business policies', () => {
  it('creates free shipping, immediate payment and 30-day returns', async () => {
    const { connector, http, expectCreated } = kit();
    expectCreated();

    const ids = await connector.createDefaultBusinessPolicies(session, OPTED_IN);

    http.assertDone();
    expect(ids).toEqual(CREATED_IDS);
    const [fulfillment, payment, returns] = http.requests.map(({ body }) => JSON.parse(body ?? ''));
    const basics = {
      marketplaceId: 'EBAY_US',
      categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' }],
    };
    expect(fulfillment).toEqual({
      ...basics,
      name: 'Crossmart standard shipping',
      handlingTime: { value: 3, unit: 'DAY' },
      shippingOptions: [
        {
          optionType: 'DOMESTIC',
          costType: 'FLAT_RATE',
          shippingServices: [
            {
              shippingServiceCode: 'USPSPriority',
              freeShipping: true,
              shippingCost: { value: '0.00', currency: 'USD' },
              sortOrder: 1,
            },
          ],
        },
      ],
    });
    expect(payment).toEqual({ ...basics, name: 'Crossmart payment', immediatePay: true });
    expect(returns).toEqual({
      ...basics,
      name: 'Crossmart 30-day returns',
      returnsAccepted: true,
      returnPeriod: { value: 30, unit: 'DAY' },
      returnShippingCostPayer: 'BUYER',
    });
  });

  it('opts the account in first when business policies are off', async () => {
    const { connector, http, expectCreated } = kit();
    http.expect(HttpMethod.Post, OPT_IN_URL, jsonResponse({}));
    expectCreated();

    const ids = await connector.createDefaultBusinessPolicies(session, {
      ...OPTED_IN,
      businessPoliciesEnabled: false,
    });

    http.assertDone();
    expect(ids).toEqual(CREATED_IDS);
  });

  it('uses the policy eBay names when it already exists, so running twice is harmless', async () => {
    const { connector, http } = kit();
    http
      .expect(
        HttpMethod.Post,
        CREATE_URLS.fulfillment,
        fixtureResponse(FIXTURES, 'policy-duplicate.json', 400),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.payment,
        fixtureResponse(FIXTURES, 'policy-duplicate-unnamed.json', 400),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.return,
        fixtureResponse(FIXTURES, 'return-policy-created.json', 201),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.fulfillment,
        fixtureResponse(FIXTURES, 'fulfillment-policies.json'),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.payment,
        fixtureResponse(FIXTURES, 'payment-policies-with-default.json'),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.return,
        fixtureResponse(FIXTURES, 'return-policies.json'),
      );

    const ids = await connector.createDefaultBusinessPolicies(session, OPTED_IN);

    http.assertDone();
    expect(ids).toEqual({ ...CREATED_IDS, payment: '6200000002' });
  });

  it('reports a duplicate eBay does not list yet', async () => {
    const { connector, http } = kit();
    http
      .expect(
        HttpMethod.Post,
        CREATE_URLS.fulfillment,
        fixtureResponse(FIXTURES, 'fulfillment-policy-created.json', 201),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.payment,
        fixtureResponse(FIXTURES, 'policy-duplicate-unnamed.json', 400),
      )
      .expect(
        HttpMethod.Post,
        CREATE_URLS.return,
        fixtureResponse(FIXTURES, 'return-policy-created.json', 201),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.fulfillment,
        fixtureResponse(FIXTURES, 'fulfillment-policies.json'),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.payment,
        fixtureResponse(FIXTURES, 'payment-policies.json'),
      )
      .expect(
        HttpMethod.Get,
        POLICY_URLS.return,
        fixtureResponse(FIXTURES, 'return-policies.json'),
      );

    await expect(connector.createDefaultBusinessPolicies(session, OPTED_IN)).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: expect.stringContaining('“Crossmart payment” exists but does not list it'),
    });
  });

  it('reports other invalid requests with eBay’s message', async () => {
    const { connector, http } = kit();
    http.expect(
      HttpMethod.Post,
      CREATE_URLS.fulfillment,
      fixtureResponse(FIXTURES, 'policy-invalid-request.json', 400),
    );

    await expect(connector.createDefaultBusinessPolicies(session, OPTED_IN)).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message:
        'eBay rejected the request: Invalid request. The shipping service is not valid for this marketplace.',
    });
  });

  it('refuses a marketplace without a default shipping service, before calling eBay', async () => {
    const { connector, http } = kit();
    const canada = fakeChannelSession(`${USER_ID}:EBAY_CA`);

    await expect(
      connector.createDefaultBusinessPolicies(canada, {
        currencyCode: 'CAD',
        businessPoliciesEnabled: false,
      }),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message:
        'Crossmart has no standard shipping service for eBay Canada. Create a shipping policy on eBay, then refresh the policies.',
    });
    expect(http.requests).toHaveLength(0);
  });

  it.each([
    ['EBAY_GB', 'GBP', 'UK_RoyalMailSecondClassStandard'],
    ['EBAY_DE', 'EUR', 'DE_DHLPaket'],
    ['EBAY_AU', 'AUD', 'AU_StandardDelivery'],
  ])('ships %s with its standard service', async (marketplaceId, currencyCode, serviceCode) => {
    const { connector, http } = kit();
    http.expect(
      HttpMethod.Post,
      CREATE_URLS.fulfillment,
      fixtureResponse(FIXTURES, 'policy-invalid-request.json', 400),
    );

    await expect(
      connector.createDefaultBusinessPolicies(fakeChannelSession(`${USER_ID}:${marketplaceId}`), {
        currencyCode,
        businessPoliciesEnabled: true,
      }),
    ).rejects.toMatchObject({ code: ChannelErrorCode.RequestRejected });
    const [service] = JSON.parse(http.requests[0]?.body ?? '').shippingOptions[0].shippingServices;
    expect(service).toMatchObject({
      shippingServiceCode: serviceCode,
      shippingCost: { currency: currencyCode },
    });
  });
});
