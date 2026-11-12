import { FalabellaCountry } from './falabella.enums.js';

/** What a Falabella country sets for a connection: its name, codes, currency and time zone. */
export interface FalabellaCountryProfile {
  name: string;
  /** The last part of the User-Agent, such as `FACL`. */
  businessUnitCode: string;
  /** ISO 4217: what listings are priced and orders paid in. */
  currencyCode: string;
  /** Seller Center reports times without a zone, in the country's local time. */
  timeZone: string;
  /** Colombia requires a tax percentage on every product (`TaxPercentage`). */
  requiresTaxPercentage: boolean;
}

/** The countries Falabella's Seller Center API documents: Chile, Colombia and Peru. */
export const FALABELLA_COUNTRIES: Readonly<Record<FalabellaCountry, FalabellaCountryProfile>> = {
  [FalabellaCountry.Chile]: {
    name: 'Chile',
    businessUnitCode: 'FACL',
    currencyCode: 'CLP',
    timeZone: 'America/Santiago',
    requiresTaxPercentage: false,
  },
  [FalabellaCountry.Colombia]: {
    name: 'Colombia',
    businessUnitCode: 'FACO',
    currencyCode: 'COP',
    timeZone: 'America/Bogota',
    requiresTaxPercentage: true,
  },
  [FalabellaCountry.Peru]: {
    name: 'Peru',
    businessUnitCode: 'FAPE',
    currencyCode: 'PEN',
    timeZone: 'America/Lima',
    requiresTaxPercentage: false,
  },
};

export function falabellaCountry(country: FalabellaCountry): FalabellaCountryProfile {
  return FALABELLA_COUNTRIES[country];
}
