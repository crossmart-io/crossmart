import type { WebhookDisabledReason } from '@crossmart/database';
import type { WebhookEventType } from '../enums/webhook-event-type.enum.js';

/** An endpoint as the API shows it. The secret is never part of it. */
export interface WebhookEndpointView {
  id: string;
  url: string;
  description: string | null;
  eventTypes: WebhookEventType[];
  enabled: boolean;
  disabledReason: WebhookDisabledReason | null;
  disabledAt: Date | null;
  consecutiveFailures: number;
  /** Until then deliveries are also signed with the secret a rotation replaced. */
  previousSecretExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** An endpoint with its signing secret, returned once: on creation and on rotation. */
export interface WebhookEndpointWithSecret {
  endpoint: WebhookEndpointView;
  secret: string;
}

export interface NewWebhookEndpoint {
  url: string;
  description?: string | null;
  eventTypes: WebhookEventType[];
}

/** Absent fields stay as they are. `enabled` true re-enables a disabled endpoint. */
export interface WebhookEndpointChanges {
  url?: string;
  description?: string | null;
  eventTypes?: WebhookEventType[];
  enabled?: boolean;
}
