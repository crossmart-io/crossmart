import { ServiceUnavailableException } from '@nestjs/common';
import type { AppConfigService } from '@crossmart/common';
import { EbayDeletionChallengeService } from './ebay-deletion-challenge.service.js';

const TOKEN = 'Crossmart_verification-token_0123456789abcdef';

function service(ebayVerificationToken: string | null): EbayDeletionChallengeService {
  const appConfig = { apiPublicUrl: 'https://api.example.com', ebayVerificationToken };
  return new EbayDeletionChallengeService(appConfig as AppConfigService);
}

describe('EbayDeletionChallengeService', () => {
  it('derives the endpoint from the API public URL', () => {
    expect(service(TOKEN).endpointUrl).toBe(
      'https://api.example.com/api/v1/webhooks/ebay/account-deletion',
    );
  });

  it('hashes the challenge code, the verification token and the endpoint URL', () => {
    // printf '%s' "a1b2c3d4e5$TOKEN$ENDPOINT" | shasum -a 256
    expect(service(TOKEN).respond('a1b2c3d4e5')).toBe(
      '112d296366f63bb23b84e3d0cbf4aaa6eb8bba7a3afb49e5633e83d5d9c1e878',
    );
  });

  it('answers 503 until the verification token is set', () => {
    expect(() => service(null).respond('a1b2c3d4e5')).toThrow(ServiceUnavailableException);
  });
});
