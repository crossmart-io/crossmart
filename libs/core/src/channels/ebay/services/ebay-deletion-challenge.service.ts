import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ebayChallengeResponse } from '@crossmart/connectors';
import { EBAY_ACCOUNT_DELETION_PATH } from '../../channels.constants.js';

const NOT_CONFIGURED = 'The eBay account deletion endpoint is not configured on this instance';

/**
 * Answers the challenge eBay sends when a marketplace account deletion endpoint is saved in
 * the developer portal, proving this instance holds the verification token.
 */
@Injectable()
export class EbayDeletionChallengeService {
  constructor(private readonly appConfig: AppConfigService) {}

  /** The endpoint URL as registered with eBay: `{API_PUBLIC_URL}/api/v1/webhooks/ebay/account-deletion`. */
  get endpointUrl(): string {
    return new URL(EBAY_ACCOUNT_DELETION_PATH, this.appConfig.apiPublicUrl).toString();
  }

  /** 503 until `EBAY_VERIFICATION_TOKEN` is set, so eBay never accepts a guessed answer. */
  respond(challengeCode: string): string {
    const token = this.appConfig.ebayVerificationToken;
    if (!token) {
      throw new ServiceUnavailableException(NOT_CONFIGURED);
    }
    return ebayChallengeResponse(challengeCode, token, this.endpointUrl);
  }
}
