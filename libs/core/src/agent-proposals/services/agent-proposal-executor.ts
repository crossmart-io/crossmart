import type { ApiToolResult, ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import type { AgentProposalGrant } from './agent-proposal-token.service.js';

/**
 * Applies an approved proposal through Crossmart's own REST API, as the agent that proposed it,
 * credited as approved by the person who did (ADR 0028). The API app provides the
 * implementation (over loopback); tests use a fake.
 */
export abstract class AgentProposalExecutor {
  abstract execute(
    grant: AgentProposalGrant,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<ApiToolResult>;
}
