/** The kinds of content in a conversation with a model, whatever the provider. */
export enum AiContentBlockType {
  Text = 'text',
  /** The model asks for a tool to run. */
  ToolUse = 'tool_use',
  /** What a tool gave back, answering one tool use. */
  ToolResult = 'tool_result',
  /**
   * A block only its provider understands (such as reasoning), kept as the provider gave it so
   * the conversation can be sent back unchanged.
   */
  ProviderSpecific = 'provider_specific',
}
