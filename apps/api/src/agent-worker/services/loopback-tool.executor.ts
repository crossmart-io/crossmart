import { Injectable } from '@nestjs/common';
import {
  AGENT_WORKER_TOKEN_HEADER,
  AgentToolExecutor,
  AgentWorkerTokenService,
  type AgentWorkerScope,
  type ApiToolResult,
  type ApiToolSpec,
  runApiTool,
} from '@crossmart/core';
import { LoopbackApi } from '../../common/loopback/loopback-api.js';

/**
 * Runs Agent Worker's tools by calling this API over the loopback interface, with the MCP
 * server's own API client and tool specs. Every call meets the same guards as any agent (the
 * person's permissions narrowed to Agent Worker's scopes, the workspace in the path, read-only
 * subscriptions, sandbox rules, validation) and is credited to "Agent Worker on behalf of" the
 * person. A fresh two-minute credential is minted per call and never leaves the server.
 */
@Injectable()
export class LoopbackToolExecutor extends AgentToolExecutor {
  constructor(
    private readonly loopback: LoopbackApi,
    private readonly tokens: AgentWorkerTokenService,
  ) {
    super();
  }

  async execute(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult> {
    const token = await this.tokens.issue(scope);
    const client = this.loopback.client({
      headers: { [AGENT_WORKER_TOKEN_HEADER]: token },
      workspaceId: scope.workspaceId,
    });
    return runApiTool(spec, client, input);
  }
}
