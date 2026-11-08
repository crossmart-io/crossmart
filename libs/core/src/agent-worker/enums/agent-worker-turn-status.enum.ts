/** Where one run of Agent Worker's loop stands. Stored as text. */
export enum AgentWorkerTurnStatus {
  Running = 'running',
  /** The agent answered and wants nothing more. */
  Completed = 'completed',
  /** The agent proposed changes and waits for the person to approve or reject them. */
  AwaitingApproval = 'awaiting_approval',
  /** The person stopped it. */
  Cancelled = 'cancelled',
  Failed = 'failed',
}
