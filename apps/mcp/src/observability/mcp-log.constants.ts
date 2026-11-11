/** The logger context of the remote server's request log. */
export const MCP_LOG_CONTEXT = 'McpRequests';

/** What a request-log line is about. */
export enum McpLogEvent {
  /** A client opened a session: its name and version, and the protocol version it asked for. */
  Initialize = 'initialize',
  /** A client read the tool list. */
  ToolsList = 'tools_list',
  /** A tool was called; one line per call, with its outcome and duration. */
  ToolCall = 'tool_call',
  /** A request body that is not JSON; answered with JSON-RPC's parse error. */
  ParseError = 'parse_error',
}

/** How a tool call ended. */
export enum ToolCallOutcome {
  Ok = 'ok',
  /** Stored as a proposal waiting for the seller (ADR 0028). */
  Proposed = 'proposed',
  /** The API refused it; the line carries the status and the API's reason. */
  Refused = 'refused',
  /** It threw, such as when the API could not be reached. */
  Failed = 'failed',
}

/** Who a request came from. */
export enum McpCallerKind {
  Agent = 'agent',
  ApiKey = 'api_key',
}

/** JSON-RPC methods the request log names. */
export enum LoggedJsonRpcMethod {
  Initialize = 'initialize',
  ToolsList = 'tools/list',
}

/** A value a client chose (its name, its version) is cut to this length in the log. */
export const CLIENT_VALUE_MAX_LENGTH = 80;
