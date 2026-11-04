import { EbayCondition } from './ebay-condition.enum.js';
import { ebayListingDefaultsSchema, resolveListingDefaults } from './ebay-listing-defaults.js';

const POLICIES = {
  fulfillment: [
    { id: 'f1', name: 'Free' },
    { id: 'f2', name: 'Express' },
  ],
  payment: [{ id: 'p1', name: 'Managed' }],
  return: [],
};

describe('resolveListingDefaults', () => {
  it('uses the only policy of a type, and none when there are several or none', () => {
    const resolved = resolveListingDefaults(undefined, POLICIES);

    expect(resolved).toMatchObject({
      fulfillmentPolicyId: null,
      paymentPolicyId: 'p1',
      returnPolicyId: null,
      condition: EbayCondition.New,
      location: null,
      merchantLocationKey: null,
    });
  });

  it('keeps a chosen policy while the account has it', () => {
    const defaults = ebayListingDefaultsSchema.parse({
      fulfillmentPolicyId: 'f2',
      paymentPolicyId: 'gone',
    });

    expect(resolveListingDefaults(defaults, POLICIES)).toMatchObject({
      fulfillmentPolicyId: 'f2',
      paymentPolicyId: 'p1',
    });
  });

  it('rejects countries that are not ISO alpha-2 codes', () => {
    const parse = (country: string) =>
      ebayListingDefaultsSchema.safeParse({ location: { postalCode: '1', country } }).success;

    expect(parse('US')).toBe(true);
    expect(parse('usa')).toBe(false);
  });
});
