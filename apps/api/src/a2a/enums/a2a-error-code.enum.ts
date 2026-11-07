/** JSON-RPC error codes: the standard ones and A2A's own (A2A 1.0 §5.4, §9.5). */
export enum A2aErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  /** Implementation-defined server error: Ask is unavailable or limited right now. */
  ServerError = -32000,
  TaskNotFound = -32001,
  TaskNotCancelable = -32002,
  PushNotificationNotSupported = -32003,
  UnsupportedOperation = -32004,
  ContentTypeNotSupported = -32005,
  InvalidAgentResponse = -32006,
  ExtendedAgentCardNotConfigured = -32007,
  ExtensionSupportRequired = -32008,
  VersionNotSupported = -32009,
}
