import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type { PublishCandidate } from '../../sdk/publishing/unmet-publish-requirement.js';
import {
  MISSING_PAYMENT_POLICY,
  unmetEbayAccountRequirements,
  unmetEbayProductRequirements,
} from './ebay-publish-prerequisites.js';
import { ebaySettings } from './ebay-listing.fixtures.js';

const HTTPS_IMAGE = 'https://cdn.example.com/a.jpg';

function candidate(overrides: Partial<PublishCandidate> = {}): PublishCandidate {
  return { imageUrls: [HTTPS_IMAGE], active: true, optionNames: [], variantCount: 1, ...overrides };
}

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
    ['an https image', [HTTPS_IMAGE], []],
  ])('checks a product with %s', (_case, imageUrls, expected) => {
    expect(requirementsOf(unmetEbayProductRequirements(candidate({ imageUrls })))).toEqual(
      expected,
    );
  });

  it('asks for a shown product, since eBay has no hidden listings', () => {
    expect(requirementsOf(unmetEbayProductRequirements(candidate({ active: false })))).toEqual([
      PublishRequirement.ActiveProduct,
    ]);
  });

  it('asks for option names only when the product has several variants', () => {
    const unnamed = candidate({ variantCount: 2, optionNames: [] });
    const named = candidate({ variantCount: 2, optionNames: ['Size'] });

    expect(requirementsOf(unmetEbayProductRequirements(unnamed))).toEqual([
      PublishRequirement.OptionNames,
    ]);
    expect(unmetEbayProductRequirements(named)).toEqual([]);
    expect(unmetEbayProductRequirements(candidate({ optionNames: [] }))).toEqual([]);
  });

  it('names every gap, images first', () => {
    const bare = candidate({ imageUrls: [], active: false, variantCount: 3 });

    expect(requirementsOf(unmetEbayProductRequirements(bare))).toEqual([
      PublishRequirement.Images,
      PublishRequirement.ActiveProduct,
      PublishRequirement.OptionNames,
    ]);
  });
});
