import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { googleSettings } from '../google-merchant.fixtures.js';
import type { PublishCandidate } from '../../sdk/publishing/unmet-publish-requirement.js';
import {
  GOOGLE_INACTIVE_PRODUCT,
  GOOGLE_NO_IMAGE,
  GOOGLE_NO_SETUP,
  unmetGoogleAccountRequirements,
  unmetGoogleProductRequirements,
} from './google-publish-prerequisites.js';

function candidate(overrides: Partial<PublishCandidate> = {}): PublishCandidate {
  return {
    imageUrls: ['https://a.example/x.jpg'],
    active: true,
    optionNames: [],
    variantCount: 1,
    ...overrides,
  };
}

describe('Google publish prerequisites', () => {
  it('is ready once the listing setup is saved', () => {
    expect(unmetGoogleAccountRequirements(googleSettings())).toEqual([]);
  });

  it('asks for the listing setup until it is saved', () => {
    const settings = googleSettings({ listingSetup: undefined });

    expect(unmetGoogleAccountRequirements(settings)).toEqual([GOOGLE_NO_SETUP]);
    expect(unmetGoogleAccountRequirements(null)).toEqual([GOOGLE_NO_SETUP]);
    expect(GOOGLE_NO_SETUP.requirement).toBe(PublishRequirement.ListingSetup);
  });

  it('needs an https image', () => {
    const httpOnly = candidate({ imageUrls: ['http://a.example/x.jpg'] });

    expect(unmetGoogleProductRequirements(httpOnly)).toEqual([GOOGLE_NO_IMAGE]);
    expect(unmetGoogleProductRequirements(candidate())).toEqual([]);
  });

  it('lists only shown products, whatever their options', () => {
    const hidden = candidate({ active: false, variantCount: 2 });

    expect(unmetGoogleProductRequirements(hidden)).toEqual([GOOGLE_INACTIVE_PRODUCT]);
  });
});
