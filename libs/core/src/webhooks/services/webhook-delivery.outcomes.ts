import { Injectable } from '@nestjs/common';
import { WebhookDeliveryStatus } from '@crossmart/database';
import type { DeliveryAttemptResult } from '../entities/delivery-attempt.js';
import type { AttemptRecord, DeliveryRef } from '../entities/delivery-ref.js';
import { maxAttemptsFor, retryDelayMs } from '../rules/retry-schedule.js';
import type { DeliveryToSend } from '../repositories/webhook-delivery.queries.js';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import { WebhookEndpointHealth } from './webhook-endpoint.health.js';

/**
 * Stores what an attempt came to: a success settles the delivery and clears the endpoint's
 * failures; a failure schedules the next attempt with backoff, or gives up after the last one,
 * and counts against the endpoint.
 */
@Injectable()
export class WebhookDeliveryOutcomes {
  constructor(
    private readonly deliveries: WebhookDeliveryRepository,
    private readonly endpoints: WebhookEndpointRepository,
    private readonly health: WebhookEndpointHealth,
  ) {}

  async record(
    ref: DeliveryRef,
    delivery: DeliveryToSend,
    result: DeliveryAttemptResult,
  ): Promise<void> {
    const attemptedAt = new Date();
    const record = this.toRecord(ref, delivery.event.type, result, attemptedAt);
    const stored = await this.deliveries.recordAttempt(ref, record);
    if (!stored) return;
    if (result.succeeded) {
      await this.endpoints.resetFailures(delivery.endpointId);
    } else {
      await this.health.recordFailure(delivery.endpoint);
    }
  }

  private toRecord(
    ref: DeliveryRef,
    eventType: string,
    result: DeliveryAttemptResult,
    attemptedAt: Date,
  ): AttemptRecord {
    const outcome = { attemptedAt, ...result };
    if (result.succeeded) {
      return { ...outcome, status: WebhookDeliveryStatus.SUCCEEDED, nextAttemptAt: null };
    }
    const attempts = ref.attempts + 1;
    if (attempts >= maxAttemptsFor(eventType)) {
      return { ...outcome, status: WebhookDeliveryStatus.FAILED, nextAttemptAt: null };
    }
    const nextAttemptAt = new Date(attemptedAt.getTime() + retryDelayMs(attempts));
    return { ...outcome, status: WebhookDeliveryStatus.RETRYING, nextAttemptAt };
  }
}
