import { hashSecret } from '@crossmart/common';
import { API_KEY_TOKEN_PREFIX, API_KEY_VISIBLE_PREFIX_LENGTH } from '../tenancy.constants.js';
import { newApiKeySecret } from './api-key-secret.js';

describe('newApiKeySecret', () => {
  it('makes a prefixed secret and keeps only its visible prefix and hash', () => {
    const { secret, prefix, hash } = newApiKeySecret();
    expect(secret.startsWith(API_KEY_TOKEN_PREFIX)).toBe(true);
    expect(prefix).toBe(secret.slice(0, API_KEY_VISIBLE_PREFIX_LENGTH));
    expect(hash).toBe(hashSecret(secret));
    expect(newApiKeySecret().secret).not.toBe(secret);
  });
});
