/**
 * The countries Crossmart lists Google products for. Each sells in its currency, and its
 * listings are written in its language. Adding a country is one entry here.
 */
export enum GoogleTargetCountry {
  US = 'US',
  GB = 'GB',
  CA = 'CA',
  AU = 'AU',
  DE = 'DE',
  FR = 'FR',
  IT = 'IT',
  ES = 'ES',
  NL = 'NL',
  IL = 'IL',
}

export interface GoogleCountryMarket {
  currencyCode: string;
  /** ISO 639-1, as Google's `contentLanguage`. */
  contentLanguage: string;
}

export const GOOGLE_COUNTRY_MARKETS: Readonly<Record<GoogleTargetCountry, GoogleCountryMarket>> = {
  [GoogleTargetCountry.US]: { currencyCode: 'USD', contentLanguage: 'en' },
  [GoogleTargetCountry.GB]: { currencyCode: 'GBP', contentLanguage: 'en' },
  [GoogleTargetCountry.CA]: { currencyCode: 'CAD', contentLanguage: 'en' },
  [GoogleTargetCountry.AU]: { currencyCode: 'AUD', contentLanguage: 'en' },
  [GoogleTargetCountry.DE]: { currencyCode: 'EUR', contentLanguage: 'de' },
  [GoogleTargetCountry.FR]: { currencyCode: 'EUR', contentLanguage: 'fr' },
  [GoogleTargetCountry.IT]: { currencyCode: 'EUR', contentLanguage: 'it' },
  [GoogleTargetCountry.ES]: { currencyCode: 'EUR', contentLanguage: 'es' },
  [GoogleTargetCountry.NL]: { currencyCode: 'EUR', contentLanguage: 'nl' },
  [GoogleTargetCountry.IL]: { currencyCode: 'ILS', contentLanguage: 'he' },
};

export const DEFAULT_GOOGLE_COUNTRY = GoogleTargetCountry.US;

export function isGoogleTargetCountry(value: string): value is GoogleTargetCountry {
  return Object.values<string>(GoogleTargetCountry).includes(value);
}

/** The business country Google reports, or the default when Crossmart does not list there. */
export function targetCountryOf(regionCode: string | null | undefined): GoogleTargetCountry {
  return regionCode && isGoogleTargetCountry(regionCode) ? regionCode : DEFAULT_GOOGLE_COUNTRY;
}
