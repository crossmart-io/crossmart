import type { SellerCredentialField } from '../../sdk/auth/seller-credentials.js';
import type { SellerCredentialValues } from '../../sdk/auth/seller-credentials.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { FalabellaAccount } from '../api/falabella-account.js';
import {
  ACCOUNT_ID_SEPARATOR,
  API_KEY_MAX_LENGTH,
  COUNTRY_MAX_LENGTH,
  SELLER_ID_MAX_LENGTH,
  SELLER_ID_PATTERN,
  USER_ID_MAX_LENGTH,
} from '../falabella.constants.js';
import { FalabellaCountry, FalabellaCredentialField } from '../falabella.enums.js';
import { falabellaError } from '../falabella-errors.js';

const INVALID_SELLER_ID = 'The seller id has letters, digits, - and _ only';

/** What a merchant pastes: the seller id, the Seller Center user and its key, and the country. */
export const FALABELLA_CREDENTIAL_FIELDS: readonly SellerCredentialField[] = [
  { key: FalabellaCredentialField.SellerId, secret: false, maxLength: SELLER_ID_MAX_LENGTH },
  { key: FalabellaCredentialField.UserId, secret: false, maxLength: USER_ID_MAX_LENGTH },
  { key: FalabellaCredentialField.ApiKey, secret: true, maxLength: API_KEY_MAX_LENGTH },
  {
    key: FalabellaCredentialField.Country,
    secret: false,
    maxLength: COUNTRY_MAX_LENGTH,
    options: Object.values(FalabellaCountry),
  },
];

function isCountry(value: string): value is FalabellaCountry {
  return (Object.values(FalabellaCountry) as string[]).includes(value);
}

/** The account the pasted values name. Core checked each field is present and in range. */
export function falabellaAccountOf(values: SellerCredentialValues): FalabellaAccount {
  const country = values[FalabellaCredentialField.Country];
  const sellerId = values[FalabellaCredentialField.SellerId];
  if (!SELLER_ID_PATTERN.test(sellerId)) {
    throw falabellaError(ChannelErrorCode.InvalidAccount, INVALID_SELLER_ID);
  }
  if (!isCountry(country)) {
    throw falabellaError(ChannelErrorCode.InvalidAccount, `${country} is not a Falabella country`);
  }
  return {
    sellerId,
    country,
    userId: values[FalabellaCredentialField.UserId],
    apiKey: values[FalabellaCredentialField.ApiKey],
  };
}

/** One connection per seller and country: `SC478FA:facl`. */
export function falabellaAccountId({ sellerId, country }: FalabellaAccount): string {
  return [sellerId, country].join(ACCOUNT_ID_SEPARATOR);
}
