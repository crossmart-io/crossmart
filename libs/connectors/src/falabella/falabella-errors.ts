import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelError } from '../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import type { ChannelErrorMessages } from '../sdk/errors/channel-error-factory.js';

export function falabellaError(code: ChannelErrorCode, message: string): ChannelError {
  return new ChannelError(ChannelType.Falabella, code, message);
}

/** What each failure means to the merchant; Falabella's own explanation follows when it has one. */
export const FALABELLA_ERROR_MESSAGES: ChannelErrorMessages = {
  [ChannelErrorCode.InvalidAccount]: 'That is not a valid Falabella account',
  [ChannelErrorCode.InvalidSignature]: 'Falabella’s reply could not be verified',
  [ChannelErrorCode.AccessDenied]:
    'This Seller Center user may not use the API. Give it the Seller API Access role.',
  [ChannelErrorCode.MissingScopes]: 'This Seller Center user lacks a role Crossmart needs',
  [ChannelErrorCode.CredentialsRejected]:
    'Falabella rejected the user id or API key. Copy them again from Seller Center.',
  [ChannelErrorCode.RateLimited]: 'Falabella is limiting requests. Crossmart will try again.',
  [ChannelErrorCode.ChannelUnavailable]: 'Falabella is not responding. Try again in a moment.',
  [ChannelErrorCode.RequestRejected]: 'Falabella refused the request',
};
