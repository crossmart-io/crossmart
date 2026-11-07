/** What started a turn. Stored as text. */
export enum AgentWorkerTurnTrigger {
  /** The person sent a message. */
  Message = 'message',
  /** The person approved or rejected proposed changes. */
  Decision = 'decision',
}
