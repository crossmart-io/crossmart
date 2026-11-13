/**
 * The Mercado Libre sites Crossmart can connect, by their site id (`GET /sites`). A seller's
 * account belongs to one site, which `GET /users/me` names as `site_id`.
 */
export enum MercadoLibreSiteId {
  Mexico = 'MLM',
  Chile = 'MLC',
  Colombia = 'MCO',
  Peru = 'MPE',
  Argentina = 'MLA',
  Brazil = 'MLB',
}

export interface MercadoLibreSite {
  /** The site's `default_currency_id` (`GET /sites`): what its listings are priced in. */
  currencyCode: string;
  /** The currency's `decimal_places` (`GET /currencies`): 0 for CLP and COP. */
  currencyDecimals: number;
  /** How the site is named to merchants. */
  siteLabel: string;
  /**
   * Where the seller signs in. Mercado Libre's guide uses `auth.mercadolibre.com.ar` and says to
   * use the country's own domain; Brazil's is `auth.mercadolivre.com.br`.
   */
  authOrigin: string;
}

export const MERCADOLIBRE_SITES: Readonly<Record<MercadoLibreSiteId, MercadoLibreSite>> = {
  [MercadoLibreSiteId.Mexico]: {
    currencyCode: 'MXN',
    currencyDecimals: 2,
    siteLabel: 'Mercado Libre Mexico',
    authOrigin: 'https://auth.mercadolibre.com.mx',
  },
  [MercadoLibreSiteId.Chile]: {
    currencyCode: 'CLP',
    currencyDecimals: 0,
    siteLabel: 'Mercado Libre Chile',
    authOrigin: 'https://auth.mercadolibre.cl',
  },
  [MercadoLibreSiteId.Colombia]: {
    currencyCode: 'COP',
    currencyDecimals: 0,
    siteLabel: 'Mercado Libre Colombia',
    authOrigin: 'https://auth.mercadolibre.com.co',
  },
  [MercadoLibreSiteId.Peru]: {
    currencyCode: 'PEN',
    currencyDecimals: 2,
    siteLabel: 'Mercado Libre Peru',
    authOrigin: 'https://auth.mercadolibre.com.pe',
  },
  [MercadoLibreSiteId.Argentina]: {
    currencyCode: 'ARS',
    currencyDecimals: 2,
    siteLabel: 'Mercado Libre Argentina',
    authOrigin: 'https://auth.mercadolibre.com.ar',
  },
  [MercadoLibreSiteId.Brazil]: {
    currencyCode: 'BRL',
    currencyDecimals: 2,
    siteLabel: 'Mercado Livre Brazil',
    authOrigin: 'https://auth.mercadolivre.com.br',
  },
};

const SITE_IDS: ReadonlySet<string> = new Set(Object.values(MercadoLibreSiteId));

export function isMercadoLibreSiteId(value: string): value is MercadoLibreSiteId {
  return SITE_IDS.has(value);
}

/** A supported site id for what the merchant picked (any case), or null. */
export function normalizeMercadoLibreSiteId(input: string): MercadoLibreSiteId | null {
  const candidate = input.trim().toUpperCase();
  return isMercadoLibreSiteId(candidate) ? candidate : null;
}
