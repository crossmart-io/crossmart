import { generateSecureToken, hashSecret } from '@crossmart/common';
import {
  API_KEY_SECRET_BYTES,
  API_KEY_TOKEN_PREFIX,
  API_KEY_VISIBLE_PREFIX_LENGTH,
} from '../tenancy.constants.js';

/** A new API key secret, with what is stored of it: the visible prefix and the hash. */
export interface ApiKeySecret {
  secret: string;
  prefix: string;
  hash: string;
}

/** A fresh secret, shown to its holder once; only its prefix and hash are kept. */
export function newApiKeySecret(): ApiKeySecret {
  const secret = `${API_KEY_TOKEN_PREFIX}${generateSecureToken(API_KEY_SECRET_BYTES)}`;
  return {
    secret,
    prefix: secret.slice(0, API_KEY_VISIBLE_PREFIX_LENGTH),
    hash: hashSecret(secret),
  };
}
