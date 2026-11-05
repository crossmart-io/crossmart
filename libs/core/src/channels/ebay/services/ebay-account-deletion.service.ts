import { Injectable, Logger, PreconditionFailedException } from '@nestjs/common';
import {
  EBAY_SIGNATURE_HEADER,
  EbayNotificationVerifier,
  type IncomingWebhook,
  parseEbayAccountDeletion,
} from '@crossmart/connectors';
import { callChannel } from '../../rules/channel-http-error.js';
import { EbayAccountPurger } from './ebay-account.purger.js';

const INVALID_SIGNATURE = 'Invalid eBay notification signature';

/**
 * Handles eBay's marketplace account deletion notices. A notice is verified against eBay's
 * signature first; a valid one is acknowledged even when Crossmart never knew the user. Logs
 * name the notification and a count, never the user, the token or the signature.
 */
@Injectable()
export class EbayAccountDeletionService {
  private readonly logger = new Logger(EbayAccountDeletionService.name);

  constructor(
    private readonly verifier: EbayNotificationVerifier,
    private readonly purger: EbayAccountPurger,
  ) {}

  /** 412 when the signature does not verify, as eBay's SDKs answer; 502 when eBay is down. */
  async receive({ rawBody, headers }: IncomingWebhook): Promise<void> {
    const signature = headers[EBAY_SIGNATURE_HEADER];
    const verified = await callChannel(() => this.verifier.verify(rawBody, signature));
    if (!verified) {
      throw new PreconditionFailedException(INVALID_SIGNATURE);
    }
    const deletion = parseEbayAccountDeletion(rawBody);
    if (!deletion) {
      this.logger.log('eBay notification acknowledged: topic not handled');
      return;
    }
    const purged = await this.purger.purge(deletion.userId);
    this.logger.log(
      `eBay account deletion ${deletion.notificationId}: ${purged} connection(s) purged`,
    );
  }
}
