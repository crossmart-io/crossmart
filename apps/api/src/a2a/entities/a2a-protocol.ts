import type { A2aRole } from '../enums/a2a-role.enum.js';
import type { A2aTaskState } from '../enums/a2a-task-state.enum.js';

/** A JSON object, as `metadata` and data parts carry. */
export type A2aStruct = Record<string, unknown>;

/** One piece of a message or artifact: exactly one of text, raw, url or data (§4.1.6). */
export interface A2aPart {
  text?: string;
  raw?: string;
  url?: string;
  data?: unknown;
  metadata?: A2aStruct;
  filename?: string;
  mediaType?: string;
}

export interface A2aMessage {
  messageId: string;
  contextId?: string;
  taskId?: string;
  role: A2aRole;
  parts: A2aPart[];
  metadata?: A2aStruct;
  extensions?: string[];
  referenceTaskIds?: string[];
}

export interface A2aTaskStatus {
  state: A2aTaskState;
  message?: A2aMessage;
  /** ISO 8601, UTC. */
  timestamp?: string;
}

export interface A2aArtifact {
  artifactId: string;
  name?: string;
  description?: string;
  parts: A2aPart[];
  metadata?: A2aStruct;
}

export interface A2aTask {
  id: string;
  contextId?: string;
  status: A2aTaskStatus;
  artifacts?: A2aArtifact[];
  history?: A2aMessage[];
  metadata?: A2aStruct;
}

/** `SendMessage`'s result: a task or a message (§9.4.1). */
export type A2aSendMessageResult = { task: A2aTask } | { message: A2aMessage };

export interface A2aListTasksResult {
  tasks: A2aTask[];
  nextPageToken: string;
  pageSize: number;
  totalSize: number;
}

/** Any method's result. */
export type A2aResult = A2aSendMessageResult | A2aTask | A2aListTasksResult;

export interface JsonRpcError {
  code: number;
  message: string;
  data?: A2aStruct[];
}

/** A JSON-RPC 2.0 response: a result or an error, with the request's id. */
export type JsonRpcResponse =
  | { jsonrpc: string; id: string | number | null; result: A2aResult }
  | { jsonrpc: string; id: string | number | null; error: JsonRpcError };
