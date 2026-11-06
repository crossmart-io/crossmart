import type { WebhookEnvelope } from '../entities/webhook-envelope.js';

/** An event as stored, the envelope's source. */
export interface StoredWebhookEvent {
  id: string;
  workspaceId: string;
  type: string;
  apiVersion: string;
  data: unknown;
  createdAt: Date;
}

/** The body every endpoint receives for an event, the same on every attempt. */
export function toWebhookEnvelope(event: StoredWebhookEvent): WebhookEnvelope {
  return {
    id: event.id,
    type: event.type,
    createdAt: event.createdAt.toISOString(),
    workspaceId: event.workspaceId,
    apiVersion: event.apiVersion,
    data: event.data,
  };
}
