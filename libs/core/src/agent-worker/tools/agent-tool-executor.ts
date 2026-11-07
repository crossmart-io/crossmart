import type { ApiToolResult, ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';

/**
 * Runs one agent tool for a conversation's owner, through Crossmart's own REST API, the way the
 * MCP server does: with the owner's permissions, in the owner's workspace only, and credited to
 * "Agent Worker on behalf of" the owner. The scope comes from the stored conversation, never
 * from the model. The API app provides the implementation; tests use a recording fake.
 */
export abstract class AgentToolExecutor {
  abstract execute(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult>;
}
