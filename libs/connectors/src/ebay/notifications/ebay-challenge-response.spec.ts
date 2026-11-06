import { ebayChallengeResponse } from './ebay-challenge-response.js';

const CHALLENGE_CODE = 'a1b2c3d4e5';
const VERIFICATION_TOKEN = 'Crossmart_verification-token_0123456789abcdef';
const ENDPOINT = 'https://api.example.com/api/v1/webhooks/ebay/account-deletion';

describe('ebayChallengeResponse', () => {
  it('hashes the challenge code, the token and the endpoint, in that order', () => {
    // printf '%s' "$CODE$TOKEN$ENDPOINT" | shasum -a 256
    expect(ebayChallengeResponse(CHALLENGE_CODE, VERIFICATION_TOKEN, ENDPOINT)).toBe(
      '112d296366f63bb23b84e3d0cbf4aaa6eb8bba7a3afb49e5633e83d5d9c1e878',
    );
  });

  it('changes with the order of the parts', () => {
    expect(ebayChallengeResponse(VERIFICATION_TOKEN, CHALLENGE_CODE, ENDPOINT)).not.toBe(
      ebayChallengeResponse(CHALLENGE_CODE, VERIFICATION_TOKEN, ENDPOINT),
    );
  });
});
