import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { FalabellaCountry } from '../falabella.enums.js';
import { falabellaError } from '../falabella-errors.js';
import { isFalabellaSettings } from '../falabella-settings.js';

const NOT_SET_UP = 'This Falabella connection has no account details. Connect it again.';

/** Who a call is made for: the Seller Center user, their key, the seller and the country. */
export interface FalabellaAccount {
  userId: string;
  apiKey: string;
  sellerId: string;
  country: FalabellaCountry;
}

/** The account of a stored connection: its settings, and the API key sealed with it. */
export async function falabellaAccount(session: ChannelSession): Promise<FalabellaAccount> {
  const settings = session.settings;
  if (!settings || !isFalabellaSettings(settings)) {
    throw falabellaError(ChannelErrorCode.CredentialsRejected, NOT_SET_UP);
  }
  const { userId, sellerId, country } = settings;
  return { userId, sellerId, country, apiKey: await session.accessToken() };
}
