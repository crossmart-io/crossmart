import { ActivityActorType } from '@crossmart/database';
import type { FailedDeliveryRecord } from '../repositories/workspace-event.queries.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { eventId, type WorkspaceEventDraft } from './workspace-event-kinds.js';

export const WEBHOOK_EVENT_PREFIX = 'webhook';

export const WEBHOOK_EVENT_COPY = {
  failed: (eventType: string, host: string) => `Could not deliver ${eventType} to ${host}`,
  unknownHost: 'an endpoint',
} as const;

/**
 * Only the endpoint's host is shown: its path or query may hold a token the merchant put there.
 */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return WEBHOOK_EVENT_COPY.unknownHost;
  }
}

/** A delivery that gave up after its retries, with why (never the response body). */
export function webhookFailureEvent(delivery: FailedDeliveryRecord): WorkspaceEventDraft {
  return {
    id: eventId(WEBHOOK_EVENT_PREFIX, delivery.id),
    type: WorkspaceEventType.WebhookDeliveryFailed,
    summary: WEBHOOK_EVENT_COPY.failed(delivery.event.type, hostOf(delivery.endpoint.url)),
    detail: delivery.error,
    actor: { type: ActivityActorType.SYSTEM, name: null, agentName: null, approvedByName: null },
    refs: { webhookEndpointId: delivery.endpointId },
    itemCount: null,
    occurredAt: delivery.updatedAt,
    failed: true,
  };
}
