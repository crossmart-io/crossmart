import { z } from 'zod';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { EbayNotificationTopic } from './ebay-notification.enums.js';

/**
 * The marketplace account deletion notice. eBay also sends the `username` and the legacy
 * `eiasToken`; Crossmart matches accounts by the immutable `userId` only and never reads the
 * others, so they cannot reach a log.
 */
const ebayAccountDeletionSchema = z.object({
  metadata: z.object({ topic: z.literal(EbayNotificationTopic.MarketplaceAccountDeletion) }),
  notification: z.object({
    notificationId: z.string().min(1),
    data: z.object({ userId: z.string().min(1) }),
  }),
});

/** An eBay user whose data must be deleted, and the notice that said so. */
export interface EbayAccountDeletion {
  notificationId: string;
  userId: string;
}

/** The deletion a verified notice asks for, or null when the notice is about another topic. */
export function parseEbayAccountDeletion(rawBody: Buffer): EbayAccountDeletion | null {
  const parsed = ebayAccountDeletionSchema.safeParse(parseJsonBody(rawBody.toString()));
  if (!parsed.success) return null;
  const { notificationId, data } = parsed.data.notification;
  return { notificationId, userId: data.userId };
}
