import { FalabellaField, type FalabellaCountry } from '../falabella.enums.js';

/**
 * A `ProductUpdate` row that changes only a SKU's business unit in the country, such as its
 * price or stock. Falabella ignores the fields a row leaves out.
 */
export function businessUnitUpdate(
  country: FalabellaCountry,
  sellerSku: string,
  fields: Readonly<Record<string, string | number>>,
): Record<string, unknown> {
  return {
    [FalabellaField.SellerSku]: sellerSku,
    [FalabellaField.BusinessUnits]: {
      [FalabellaField.BusinessUnit]: { [FalabellaField.OperatorCode]: country, ...fields },
    },
  };
}
