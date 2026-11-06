import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import { googleSettings } from '../google-merchant.fixtures.js';
import {
  GOOGLE_NO_IMAGE,
  GOOGLE_NO_SETUP,
  unmetGoogleAccountRequirements,
  unmetGoogleProductRequirements,
} from './google-publish-prerequisites.js';

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
    expect(unmetGoogleProductRequirements({ imageUrls: ['http://a.example/x.jpg'] })).toEqual([
      GOOGLE_NO_IMAGE,
    ]);
    expect(unmetGoogleProductRequirements({ imageUrls: ['https://a.example/x.jpg'] })).toEqual([]);
  });
});
