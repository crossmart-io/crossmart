/** Jobs on the `webhooks` queue. */
export enum WebhookJobName {
  /** Claims due deliveries and queues one `Deliver` job each. Scheduled. */
  Dispatch = 'dispatch',
  /** Sends one delivery. */
  Deliver = 'deliver',
  /** Deletes events and deliveries past retention. Scheduled daily. */
  CleanUp = 'clean-up',
}
