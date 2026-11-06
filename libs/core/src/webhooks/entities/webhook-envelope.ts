/**
 * The JSON body of every delivery. Its `id` stays the same across retries and redeliveries.
 * `type` is a `WebhookEventType` value, kept as text so an event a newer version stored during
 * a rolling deploy is still sent as it is.
 */
export interface WebhookEnvelope {
  id: string;
  type: string;
  /** ISO 8601, when the change happened. */
  createdAt: string;
  workspaceId: string;
  apiVersion: string;
  data: unknown;
}
