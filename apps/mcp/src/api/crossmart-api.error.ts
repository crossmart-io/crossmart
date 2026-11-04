/** The API refused a call. The message is the API's own, safe to show to the agent. */
export class CrossmartApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'CrossmartApiError';
  }
}
