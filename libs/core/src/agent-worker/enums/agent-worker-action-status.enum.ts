/** Where one tool call stands. Stored as text. */
export enum AgentWorkerActionStatus {
  /** A read running now. */
  Running = 'running',
  /** A read that answered. */
  Succeeded = 'succeeded',
  /** A read the API refused. */
  Failed = 'failed',
  /** A change waiting for the person's approval. */
  Proposed = 'proposed',
  /** A call that was never run nor proposed: unknown tool, invalid input, or not allowed now. */
  Refused = 'refused',
  /** The person rejected the change; nothing was done. */
  Rejected = 'rejected',
  /** The person moved on without deciding; nothing was done. */
  Expired = 'expired',
  /** Stopped before it ran. */
  Cancelled = 'cancelled',
  /** Approved and being made now. */
  Executing = 'executing',
  /** Approved and made. */
  Executed = 'executed',
  /** Approved, but the API refused it. */
  ExecutionFailed = 'execution_failed',
}
