import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import {
  MISSING_PAYMENT_POLICY,
  unmetEbayAccountRequirements,
  unmetEbayProductRequirements,
} from './ebay-publish-prerequisites.js';
import { ebaySettings } from './ebay-listing.fixtures.js';

function requirementsOf(unmet: { requirement: PublishRequirement }[]): PublishRequirement[] {
  return unmet.map((entry) => entry.requirement);
}

describe('eBay publish prerequisites', () => {
  it('is ready when every policy resolves and a ship-from location is set', () => {
    expect(unmetEbayAccountRequirements(ebaySettings())).toEqual([]);
  });

  it('asks for settings the connection has not read yet', () => {
    expect(requirementsOf(unmetEbayAccountRequirements(null))).toEqual([
      PublishRequirement.AccountSettings,
    ]);
  });

  it('names each policy a listing could not resolve, and the ship-from location', () => {
    const settings = ebaySettings({ listingDefaults: undefined });
    settings.policies.payment = [];

    const unmet = unmetEbayAccountRequirements(settings);

    expect(requirementsOf(unmet)).toEqual([
      PublishRequirement.ShippingPolicy,
      PublishRequirement.PaymentPolicy,
      PublishRequirement.ShipFromLocation,
    ]);
    expect(unmet[1]?.reason).toBe(MISSING_PAYMENT_POLICY);
  });

  it.each([
    ['no images', [], [PublishRequirement.Images]],
    ['only http images', ['http://cdn.example.com/a.jpg'], [PublishRequirement.Images]],
    ['an https image', ['https://cdn.example.com/a.jpg'], []],
  ])('checks a product with %s', (_case, imageUrls, expected) => {
    expect(requirementsOf(unmetEbayProductRequirements({ imageUrls }))).toEqual(expected);
  });
});
