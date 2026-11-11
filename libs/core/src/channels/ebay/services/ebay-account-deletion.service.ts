import { Injectable, Logger, PreconditionFailedException } from '@nestjs/common';
import {
  EBAY_SIGNATURE_HEADER,
  EbayNotificationVerifier,
  type IncomingWebhook,
  parseEbayAccountDeletion,
} from '@crossmart/connectors';
import { EBAY_DELETION_SUMMARY_EVERY } from '../../channels.constants.js';
import { callChannel } from '../../rules/channel-http-error.js';
import { EbayAccountPurger } from './ebay-account.purger.js';

const INVALID_SIGNATURE = 'Invalid eBay notification signature';

/**
 * Handles eBay's marketplace account deletion notices. A notice is verified against eBay's
 * signature first; a valid one is acknowledged even when Crossmart never knew the user. Logs
 * name the notification and a count, never the user, the token or the signature.
 *
 * eBay sends every deletion on the marketplace to every app, dozens an hour, and almost none
 * concern a Crossmart user. Those are only counted, with one summary line per
 * `EBAY_DELETION_SUMMARY_EVERY`, so they do not crowd out other logs. A purge that found
 * connections is logged, and one that failed is a warning.
 */
@Injectable()
export class EbayAccountDeletionService {
  private readonly logger = new Logger(EbayAccountDeletionService.name);
  /** Verified notices since the last summary line, and how many of them purged anything. */
  private received = 0;
  private matched = 0;

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
      this.countNotice(false);
      return;
    }
    const purged = await this.purge(deletion.notificationId, deletion.userId);
    if (purged > 0) {
      this.logger.log(
        `eBay account deletion ${deletion.notificationId}: ${purged} connection(s) purged`,
      );
    }
    this.countNotice(purged > 0);
  }

  /** Purges the user's connections; a failure is logged by notification, then eBay retries. */
  private async purge(notificationId: string, userId: string): Promise<number> {
    try {
      return await this.purger.purge(userId);
    } catch (error) {
      const reason = error instanceof Error ? error.name : typeof error;
      this.logger.warn(`eBay account deletion ${notificationId}: purge failed (${reason})`);
      throw error;
    }
  }

  /** Counts a verified notice, and logs one summary line per `EBAY_DELETION_SUMMARY_EVERY`. */
  private countNotice(purgedAny: boolean): void {
    this.received += 1;
    if (purgedAny) this.matched += 1;
    if (this.received < EBAY_DELETION_SUMMARY_EVERY) return;
    this.logger.log(
      `eBay notifications: ${this.received} verified, ${this.matched} purged connections`,
    );
    this.received = 0;
    this.matched = 0;
  }
}
