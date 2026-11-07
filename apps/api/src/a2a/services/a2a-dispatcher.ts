import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { findEnumValue } from '@crossmart/common';
import type { AskCaller } from '@crossmart/core';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { AskCallerResolver } from '../../ask/services/ask-caller.resolver.js';
import {
  A2A_DEFAULT_CLIENT_VERSION,
  A2A_PROTOCOL_VERSION,
  JSON_RPC_VERSION,
  MAJOR_MINOR_PARTS,
  VERSION_SEPARATOR,
} from '../a2a.constants.js';
import type { A2aResult, JsonRpcResponse } from '../entities/a2a-protocol.js';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';
import { A2aMethod } from '../enums/a2a-method.enum.js';
import { A2aErrorReason, A2aRpcError } from '../errors/a2a-rpc.error.js';
import {
  cancelTaskParamsSchema,
  getTaskParamsSchema,
  jsonRpcRequestSchema,
  listTasksParamsSchema,
  sendMessageParamsSchema,
} from '../schemas/a2a-request.schemas.js';
import { toRpcError } from './a2a-error.mapper.js';
import { A2aMessageHandler } from './a2a-message.handler.js';
import { A2aTaskReader } from './a2a-task.reader.js';

type RequestId = string | number | null;
type MethodHandler = (params: unknown, caller: AskCaller) => Promise<A2aResult>;

/** A method this agent answers with an error, whatever the parameters. */
function refuse(error: () => A2aRpcError): MethodHandler {
  return () => Promise.reject(error());
}

const NO_STREAMING = 'Streaming is not supported; use SendMessage and GetTask';
const NO_PUSH = 'Push notifications are not supported; poll with GetTask';
const NO_EXTENDED_CARD = 'This agent has no extended Agent Card';
const INVALID_ENVELOPE = 'Request payload validation error';
const NO_PARAMS = {};

/** `Major.Minor` of a version; an empty one is 0.3, as the specification says. */
function majorMinor(version: string): string {
  const requested = version.trim() || A2A_DEFAULT_CLIENT_VERSION;
  return requested.split(VERSION_SEPARATOR).slice(0, MAJOR_MINOR_PARTS).join(VERSION_SEPARATOR);
}

function parseParams<Output>(schema: z.ZodType<Output>, params: unknown): Output {
  const parsed = schema.safeParse(params ?? NO_PARAMS);
  if (!parsed.success) throw A2aRpcError.invalidParams(parsed.error.issues[0]?.message ?? '');
  return parsed.data;
}

/** The request id, when the payload has one, so even an invalid request is answered by id. */
function requestIdOf(body: unknown): RequestId {
  if (typeof body !== 'object' || body === null || !('id' in body)) return null;
  const { id } = body;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

/**
 * Crossmart's A2A JSON-RPC endpoint (A2A 1.0 §9): checks the envelope and the protocol
 * version, identifies the caller as Ask does, and runs the method. Every failure is a
 * JSON-RPC error object; nothing is thrown to the HTTP layer.
 */
@Injectable()
export class A2aDispatcher {
  /** What each method does: run it, or refuse what this agent does not support. */
  private readonly handlers: Readonly<Record<A2aMethod, MethodHandler>>;

  constructor(
    private readonly callers: AskCallerResolver,
    messages: A2aMessageHandler,
    tasks: A2aTaskReader,
  ) {
    const streaming = refuse(() => A2aRpcError.unsupported(NO_STREAMING));
    const push = refuse(
      () =>
        new A2aRpcError(
          A2aErrorCode.PushNotificationNotSupported,
          NO_PUSH,
          A2aErrorReason.PushNotSupported,
        ),
    );
    this.handlers = {
      [A2aMethod.SendMessage]: (params, caller) =>
        messages.send(parseParams(sendMessageParamsSchema, params), caller),
      [A2aMethod.GetTask]: (params, caller) =>
        tasks.get(parseParams(getTaskParamsSchema, params), caller),
      [A2aMethod.ListTasks]: (params, caller) =>
        tasks.list(parseParams(listTasksParamsSchema, params), caller),
      [A2aMethod.CancelTask]: (params, caller) =>
        tasks.cancel(parseParams(cancelTaskParamsSchema, params), caller),
      [A2aMethod.SendStreamingMessage]: streaming,
      [A2aMethod.SubscribeToTask]: streaming,
      [A2aMethod.CreateTaskPushNotificationConfig]: push,
      [A2aMethod.GetTaskPushNotificationConfig]: push,
      [A2aMethod.ListTaskPushNotificationConfigs]: push,
      [A2aMethod.DeleteTaskPushNotificationConfig]: push,
      [A2aMethod.GetExtendedAgentCard]: refuse(() => A2aRpcError.unsupported(NO_EXTENDED_CARD)),
    };
  }

  async handle(
    body: unknown,
    request: AuthenticatedRequest,
    version: string,
  ): Promise<JsonRpcResponse> {
    const envelope = jsonRpcRequestSchema.safeParse(body);
    if (!envelope.success) {
      const error = A2aRpcError.invalidRequest(INVALID_ENVELOPE);
      return { jsonrpc: JSON_RPC_VERSION, id: requestIdOf(body), error: error.toJson() };
    }
    const { id = null, method, params } = envelope.data;
    try {
      if (majorMinor(version) !== A2A_PROTOCOL_VERSION)
        throw A2aRpcError.versionNotSupported(version);
      const caller = await this.callers.resolve(request);
      return { jsonrpc: JSON_RPC_VERSION, id, result: await this.dispatch(method, params, caller) };
    } catch (error) {
      return { jsonrpc: JSON_RPC_VERSION, id, error: toRpcError(error, taskIdOf(params)).toJson() };
    }
  }

  private dispatch(method: string, params: unknown, caller: AskCaller): Promise<A2aResult> {
    const known = findEnumValue(A2aMethod, method);
    if (!known) throw A2aRpcError.methodNotFound(method);
    return this.handlers[known](params, caller);
  }
}

/** The task a method names, for the error of a task that is not found. */
function taskIdOf(params: unknown): string | undefined {
  if (typeof params !== 'object' || params === null || !('id' in params)) return undefined;
  return typeof params.id === 'string' ? params.id : undefined;
}
