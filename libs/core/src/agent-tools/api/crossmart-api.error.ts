/** The API refused a call. The message is the API's own, safe to show to the agent. */
export class CrossmartApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** The API's machine-readable reason, such as `plan_limit_reached`, when it gives one. */
    readonly code?: string,
  ) {
    super(message);
    this.name = 'CrossmartApiError';
  }
}
