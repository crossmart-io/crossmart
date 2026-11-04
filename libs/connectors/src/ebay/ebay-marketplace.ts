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
}

export const EBAY_MARKETPLACES: Readonly<Record<EbayMarketplaceId, EbayMarketplace>> = {
  [EbayMarketplaceId.UnitedStates]: { currencyCode: 'USD', siteLabel: 'eBay US' },
  [EbayMarketplaceId.UnitedKingdom]: { currencyCode: 'GBP', siteLabel: 'eBay UK' },
  [EbayMarketplaceId.Germany]: { currencyCode: 'EUR', siteLabel: 'eBay Germany' },
  [EbayMarketplaceId.Australia]: { currencyCode: 'AUD', siteLabel: 'eBay Australia' },
  [EbayMarketplaceId.Canada]: { currencyCode: 'CAD', siteLabel: 'eBay Canada' },
  [EbayMarketplaceId.France]: { currencyCode: 'EUR', siteLabel: 'eBay France' },
  [EbayMarketplaceId.Italy]: { currencyCode: 'EUR', siteLabel: 'eBay Italy' },
  [EbayMarketplaceId.Spain]: { currencyCode: 'EUR', siteLabel: 'eBay Spain' },
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
