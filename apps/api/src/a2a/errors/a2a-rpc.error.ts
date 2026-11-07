import {
  A2A_DEFAULT_CLIENT_VERSION,
  A2A_PROTOCOL_VERSION,
  ERROR_DOMAIN,
  ERROR_INFO_TYPE,
} from '../a2a.constants.js';
import type { A2aStruct, JsonRpcError } from '../entities/a2a-protocol.js';
import { A2aErrorCode } from '../enums/a2a-error-code.enum.js';

/** Why a call failed, as `google.rpc.ErrorInfo` reasons. */
export enum A2aErrorReason {
  InvalidJson = 'INVALID_JSON',
  InvalidRequest = 'INVALID_REQUEST',
  MethodNotFound = 'METHOD_NOT_FOUND',
  InvalidParams = 'INVALID_PARAMS',
  TaskNotFound = 'TASK_NOT_FOUND',
  TaskNotCancelable = 'TASK_NOT_CANCELABLE',
  PushNotSupported = 'PUSH_NOTIFICATION_NOT_SUPPORTED',
  UnsupportedOperation = 'UNSUPPORTED_OPERATION',
  ContentTypeNotSupported = 'CONTENT_TYPE_NOT_SUPPORTED',
  VersionNotSupported = 'VERSION_NOT_SUPPORTED',
  Unavailable = 'UNAVAILABLE',
  Internal = 'INTERNAL',
}

/** A failure to report as a JSON-RPC error object, never as an HTTP error. */
export class A2aRpcError extends Error {
  constructor(
    readonly code: A2aErrorCode,
    message: string,
    readonly reason: A2aErrorReason,
    readonly metadata: Record<string, string> = {},
  ) {
    super(message);
  }

  toJson(): JsonRpcError {
    const info: A2aStruct = {
      '@type': ERROR_INFO_TYPE,
      reason: this.reason,
      domain: ERROR_DOMAIN,
      metadata: this.metadata,
    };
    return { code: this.code, message: this.message, data: [info] };
  }

  static invalidRequest(message: string): A2aRpcError {
    return new A2aRpcError(A2aErrorCode.InvalidRequest, message, A2aErrorReason.InvalidRequest);
  }

  static invalidParams(message: string): A2aRpcError {
    return new A2aRpcError(A2aErrorCode.InvalidParams, message, A2aErrorReason.InvalidParams);
  }

  static methodNotFound(method: string): A2aRpcError {
    return new A2aRpcError(
      A2aErrorCode.MethodNotFound,
      'Method not found',
      A2aErrorReason.MethodNotFound,
      {
        method,
      },
    );
  }

  static taskNotFound(taskId: string): A2aRpcError {
    return new A2aRpcError(
      A2aErrorCode.TaskNotFound,
      'Task not found',
      A2aErrorReason.TaskNotFound,
      {
        taskId,
      },
    );
  }

  static unsupported(message: string): A2aRpcError {
    return new A2aRpcError(
      A2aErrorCode.UnsupportedOperation,
      message,
      A2aErrorReason.UnsupportedOperation,
    );
  }

  static versionNotSupported(requested: string): A2aRpcError {
    return new A2aRpcError(
      A2aErrorCode.VersionNotSupported,
      `A2A version ${requested || A2A_DEFAULT_CLIENT_VERSION} is not supported; send A2A-Version: ${A2A_PROTOCOL_VERSION}`,
      A2aErrorReason.VersionNotSupported,
      { supportedVersions: A2A_PROTOCOL_VERSION },
    );
  }
}
