import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { McpRequestLog } from '../observability/mcp-request-log.js';
import { JSON_RPC_VERSION } from '../mcp.constants.js';

const BAD_REQUEST = 400;
/** body-parser's `type` for a body that is not valid JSON. */
const BODY_PARSE_FAILED = 'entity.parse.failed';
/** JSON-RPC's code for a request that is not valid JSON. */
const PARSE_ERROR_CODE = -32700;
const PARSE_ERROR_MESSAGE = 'Parse error: the request body is not valid JSON';

const BODY_PARSE_ERROR = z.object({ type: z.literal(BODY_PARSE_FAILED) });

/**
 * Answers a body that is not JSON with JSON-RPC's parse error, and logs one line without the
 * body or a stack trace: the body may hold a token, and the parser's message quotes it. Other
 * errors go on to Express.
 */
export function bodyParseErrorHandler(log: McpRequestLog) {
  return (error: unknown, _request: Request, response: Response, next: NextFunction): void => {
    if (!BODY_PARSE_ERROR.safeParse(error).success) {
      next(error);
      return;
    }
    log.parseError();
    response.status(BAD_REQUEST).json({
      jsonrpc: JSON_RPC_VERSION,
      error: { code: PARSE_ERROR_CODE, message: PARSE_ERROR_MESSAGE },
      id: null,
    });
  };
}
