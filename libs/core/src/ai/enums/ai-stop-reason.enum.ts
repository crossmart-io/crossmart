/** Why a model stopped, as far as Crossmart cares: only a completed answer is usable. */
export enum AiStopReason {
  Completed = 'completed',
  /** The model declined to answer. */
  Refused = 'refused',
  /** The answer hit the output limit and is cut off. */
  Truncated = 'truncated',
  /** The model asked for tools to run before it goes on (conversations with tools only). */
  ToolUse = 'tool_use',
}
