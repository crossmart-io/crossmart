import type { WebhookDeliveryStatus } from '@crossmart/database';

/**
 * A claimed delivery, as a `deliver` job carries it. `attempts` is the count when it was claimed,
 * so a job that runs late, after another worker already tried, changes nothing.
 */
export interface DeliveryRef {
  deliveryId: string;
  attempts: number;
}

/** How one attempt ended, as stored on the delivery. */
export interface AttemptRecord {
  status: WebhookDeliveryStatus;
  attemptedAt: Date;
  nextAttemptAt: Date | null;
  responseStatus: number | null;
  durationMs: number;
  error: string | null;
}
