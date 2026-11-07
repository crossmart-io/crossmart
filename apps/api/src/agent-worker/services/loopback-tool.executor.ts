import { Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { AddressInfo } from 'node:net';
import {
  AGENT_WORKER_TOKEN_HEADER,
  AgentToolExecutor,
  AgentWorkerTokenService,
  type AgentWorkerScope,
  type ApiToolResult,
  type ApiToolSpec,
  CrossmartApiClient,
  runApiTool,
} from '@crossmart/core';
import { API_NOT_LISTENING, LOOPBACK_HOST, LOOPBACK_PROTOCOL } from '../agent-worker.constants.js';

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
    private readonly adapterHost: HttpAdapterHost,
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
    const client = new CrossmartApiClient(this.baseUrl(), {
      headers: { [AGENT_WORKER_TOKEN_HEADER]: token },
      workspaceId: scope.workspaceId,
    });
    return runApiTool(spec, client, input);
  }

  /** This server's own address, on the port it actually listens on. */
  private baseUrl(): string {
    const address = this.adapterHost.httpAdapter.getHttpServer().address() as
      AddressInfo | string | null;
    if (!address || typeof address === 'string') throw new Error(API_NOT_LISTENING);
    return `${LOOPBACK_PROTOCOL}//${LOOPBACK_HOST}:${address.port}`;
  }
}
