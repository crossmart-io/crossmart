import { Injectable } from '@nestjs/common';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  MS_PER_DAY,
  WEBHOOK_RETENTION_BATCH_SIZE,
  WEBHOOK_RETENTION_DAYS,
} from '../webhooks.constants.js';

/** Deletes events, with their deliveries, once they are older than the retention period. */
@Injectable()
export class WebhookRetentionService {
  constructor(private readonly deliveries: WebhookDeliveryRepository) {}

  /** Returns how many events were deleted. Works in batches, so no statement runs for long. */
  async purge(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - WEBHOOK_RETENTION_DAYS * MS_PER_DAY);
    let deleted = 0;
    let batch: number;
    do {
      batch = await this.deliveries.deleteEventsBefore(cutoff, WEBHOOK_RETENTION_BATCH_SIZE);
      deleted += batch;
    } while (batch === WEBHOOK_RETENTION_BATCH_SIZE);
    return deleted;
  }
}
