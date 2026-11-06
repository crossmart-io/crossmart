/** What one attempt to send a delivery came to. */
export interface DeliveryAttemptResult {
  /** A 2xx answer. */
  succeeded: boolean;
  responseStatus: number | null;
  durationMs: number;
  /** Safe to show; null on success. */
  error: string | null;
}

/** A request to send: where, what and how it is signed. */
export interface WebhookRequest {
  url: string;
  body: string;
  headers: Readonly<Record<string, string>>;
}
