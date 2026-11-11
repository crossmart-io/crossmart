import { agentCaller, apiKeyCaller } from './mcp-caller.js';
import { logJsonRpcRequest } from './json-rpc-log.js';
import { ToolCallOutcome } from './mcp-log.constants.js';
import { type LineLogger, McpRequestLog } from './mcp-request-log.js';

const TOKEN = 'eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl';
const API_KEY = 'cm_abcdefgh_secret_part_of_the_key';
const AGENT = agentCaller({
  workspaceId: 'ws-1',
  scopes: [],
  userId: 'user-1',
  clientId: 'https://claude.ai/oauth/claude-code-client-metadata',
});

function setup() {
  const logger = { log: vi.fn<LineLogger['log']>(), warn: vi.fn<LineLogger['warn']>() };
  return { logger, log: new McpRequestLog(logger) };
}

function lines(logger: ReturnType<typeof setup>['logger']): string[] {
  return logger.log.mock.calls.map(([line]) => line);
}

describe('McpRequestLog', () => {
  it('logs a tool call on one line, with who, what, how it went and how long it took', () => {
    const { logger, log } = setup();

    log.toolCall(AGENT, {
      tool: 'list_products',
      outcome: ToolCallOutcome.Ok,
      durationMs: 42,
      items: 0,
    });

    expect(lines(logger)).toEqual([
      'event=tool_call tool=list_products outcome=ok items=0 durationMs=42 caller=agent ' +
        'principal=user-1 client=https://claude.ai/oauth/claude-code-client-metadata workspace=ws-1',
    ]);
  });

  it('logs a refusal with its status and the API’s reason', () => {
    const { logger, log } = setup();

    log.toolCall(apiKeyCaller(API_KEY), {
      tool: 'add_product_to_store',
      outcome: ToolCallOutcome.Refused,
      durationMs: 7,
      status: 403,
      code: 'sandbox_claim_required',
      workspaceId: 'ws-2',
    });

    expect(lines(logger)[0]).toBe(
      'event=tool_call tool=add_product_to_store outcome=refused status=403 ' +
        'code=sandbox_claim_required durationMs=7 caller=api_key principal=cm_abcdefg workspace=ws-2',
    );
  });

  it('names an API key by its visible prefix, never the whole key', () => {
    const { logger, log } = setup();

    log.toolsList(apiKeyCaller(API_KEY));

    expect(lines(logger)[0]).toBe('event=tools_list caller=api_key principal=cm_abcdefg');
    expect(lines(logger)[0]).not.toContain('secret_part');
  });

  it('logs a session opening with the client’s name, version and protocol', () => {
    const { logger, log } = setup();

    logJsonRpcRequest(log, AGENT, {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        clientInfo: { name: 'claude-code', version: '2.1.0' },
        capabilities: {},
      },
    });

    expect(lines(logger)[0]).toMatch(
      /^event=initialize clientName=claude-code clientVersion=2\.1\.0 protocol=2025-06-18 caller=agent/,
    );
  });

  it('logs every tool-list read of a batch, and nothing about tool calls', () => {
    const { logger, log } = setup();

    logJsonRpcRequest(log, AGENT, [
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'x', arguments: {} } },
    ]);

    expect(lines(logger)).toHaveLength(1);
    expect(lines(logger)[0]).toMatch(/^event=tools_list /);
  });

  it('never logs arguments, content, tokens or emails, even from a hostile client', () => {
    const { logger, log } = setup();

    logJsonRpcRequest(log, AGENT, {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        clientInfo: { name: 'evil\nevent=forged', version: '1' },
        token: TOKEN,
        email: 'seller@example.com',
      },
    });
    log.toolCall(AGENT, {
      tool: 'create_product',
      outcome: ToolCallOutcome.Proposed,
      durationMs: 3,
    });

    const logged = lines(logger).join('\n');
    expect(logged).not.toContain(TOKEN);
    expect(logged).not.toContain('seller@example.com');
    expect(logged.split('\n')).toHaveLength(2);
    expect(logged).toContain('clientName="evil\\nevent=forged"');
  });

  it('cuts a long client name short', () => {
    const { logger, log } = setup();

    log.initialize(AGENT, { clientName: 'x'.repeat(500) });

    expect(lines(logger)[0]).toContain(`clientName=${'x'.repeat(80)} `);
  });

  it('warns about a body that is not JSON without quoting it', () => {
    const { logger, log } = setup();

    log.parseError();

    expect(logger.warn).toHaveBeenCalledWith('event=parse_error');
  });

  it('gives each tool call to the caller’s line', () => {
    const { logger, log } = setup();

    log.observerFor(AGENT).toolCalled({
      tool: 'get_started',
      outcome: ToolCallOutcome.Failed,
      durationMs: 1,
    });

    expect(lines(logger)[0]).toMatch(
      /^event=tool_call tool=get_started outcome=failed .*workspace=ws-1$/,
    );
  });
});
