/** The eBay sites Crossmart can connect, by their marketplace id. */
export enum EbayMarketplaceId {
  UnitedStates = 'EBAY_US',
  UnitedKingdom = 'EBAY_GB',
  Germany = 'EBAY_DE',
  Australia = 'EBAY_AU',
  Canada = 'EBAY_CA',
  France = 'EBAY_FR',
  Italy = 'EBAY_IT',
  Spain = 'EBAY_ES',
}

export interface EbayMarketplace {
  /** ISO 4217 code of the currency listings on the site are priced in. */
  currencyCode: string;
  /** How the site is named to merchants, such as "eBay US". */
  siteLabel: string;
  /** The `Content-Language` the Inventory API expects for listings on the site. */
  contentLanguage: string;
  /** Where buyers see the site's listings, such as `www.ebay.co.uk`. */
  siteHost: string;
}

export const EBAY_MARKETPLACES: Readonly<Record<EbayMarketplaceId, EbayMarketplace>> = {
  [EbayMarketplaceId.UnitedStates]: {
    currencyCode: 'USD',
    siteLabel: 'eBay US',
    contentLanguage: 'en-US',
    siteHost: 'www.ebay.com',
  },
  [EbayMarketplaceId.UnitedKingdom]: {
    currencyCode: 'GBP',
    siteLabel: 'eBay UK',
    contentLanguage: 'en-GB',
    siteHost: 'www.ebay.co.uk',
  },
  [EbayMarketplaceId.Germany]: {
    currencyCode: 'EUR',
    siteLabel: 'eBay Germany',
    contentLanguage: 'de-DE',
    siteHost: 'www.ebay.de',
  },
  [EbayMarketplaceId.Australia]: {
    currencyCode: 'AUD',
    siteLabel: 'eBay Australia',
    contentLanguage: 'en-AU',
    siteHost: 'www.ebay.com.au',
  },
  [EbayMarketplaceId.Canada]: {
    currencyCode: 'CAD',
    siteLabel: 'eBay Canada',
    contentLanguage: 'en-CA',
    siteHost: 'www.ebay.ca',
  },
  [EbayMarketplaceId.France]: {
    currencyCode: 'EUR',
    siteLabel: 'eBay France',
    contentLanguage: 'fr-FR',
    siteHost: 'www.ebay.fr',
  },
  [EbayMarketplaceId.Italy]: {
    currencyCode: 'EUR',
    siteLabel: 'eBay Italy',
    contentLanguage: 'it-IT',
    siteHost: 'www.ebay.it',
  },
  [EbayMarketplaceId.Spain]: {
    currencyCode: 'EUR',
    siteLabel: 'eBay Spain',
    contentLanguage: 'es-ES',
    siteHost: 'www.ebay.es',
  },
};

const MARKETPLACE_IDS: ReadonlySet<string> = new Set(Object.values(EbayMarketplaceId));

export function isEbayMarketplaceId(value: string): value is EbayMarketplaceId {
  return MARKETPLACE_IDS.has(value);
}

/** A supported marketplace id for what the merchant picked (any case), or null. */
export function normalizeMarketplaceId(input: string): EbayMarketplaceId | null {
  const candidate = input.trim().toUpperCase();
  return isEbayMarketplaceId(candidate) ? candidate : null;
}
