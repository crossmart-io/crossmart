/** The events of a streamed Agent Worker turn, one per server-sent event. */
export enum AgentWorkerEventType {
  /** The turn began; carries the turn. */
  TurnStarted = 'turn_started',
  /** A piece of the agent's answer as the model writes it; carries `delta`. */
  TextDelta = 'text_delta',
  /** A message was stored: the person's, or one of the agent's; carries the message. */
  Message = 'message',
  /** A read began; carries the action. */
  ToolStarted = 'tool_started',
  /** A read finished, or a call was refused; carries the action. */
  ToolFinished = 'tool_finished',
  /** A change waits for approval; carries the action with its preview. */
  ActionProposed = 'action_proposed',
  /** A decision was applied to a proposed change; carries the action. */
  ActionDecided = 'action_decided',
  /** The turn ended; carries the turn, whose status says how. */
  TurnFinished = 'turn_finished',
  /** The turn could not go on; carries the error. */
  Error = 'error',
}
