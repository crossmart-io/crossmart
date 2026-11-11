import type { NextFunction, Request, Response } from 'express';
import type { McpRequestLog } from '../observability/mcp-request-log.js';
import { bodyParseErrorHandler } from './body-parse-error.js';

function setup() {
  const parseError = vi.fn<McpRequestLog['parseError']>();
  const log = { parseError } as unknown as McpRequestLog;
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { handler: bodyParseErrorHandler(log), parseError, json, response, next, status };
}

describe('bodyParseErrorHandler', () => {
  it('answers a body that is not JSON with JSON-RPC’s parse error, and logs one line', () => {
    const { handler, parseError, json, response, next, status } = setup();
    const error = Object.assign(new SyntaxError('Unexpected token in "Bearer secret"'), {
      type: 'entity.parse.failed',
      body: '{"token":"Bearer secret"',
      status: 400,
    });

    handler(error, {} as Request, response, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: { code: -32700, message: expect.any(String) },
      id: null,
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('secret');
    expect(parseError).toHaveBeenCalledWith();
    expect(next).not.toHaveBeenCalled();
  });

  it('passes other errors on to Express', () => {
    const { handler, parseError, response, next } = setup();
    const error = new Error('something else');

    handler(error, {} as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(parseError).not.toHaveBeenCalled();
  });
});
