import { Injectable } from '@nestjs/common';
import { AppConfigService, InternalToken } from '@crossmart/common';
import {
  AGENT_WORKER_CONVERSATION_CLAIM,
  AGENT_WORKER_TOKEN_AUDIENCE,
  AGENT_WORKER_TOKEN_ISSUER,
  AGENT_WORKER_TOKEN_KEY_CONTEXT,
  AGENT_WORKER_TOKEN_TTL_SECONDS,
  AGENT_WORKER_WORKSPACE_CLAIM,
} from '../agent-worker.constants.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';

/**
 * Agent Worker's credential for its own calls to the API: a JWT naming the person, workspace and
 * conversation, valid for two minutes and signed with a key derived from `BETTER_AUTH_SECRET`
 * for this purpose only. Only the API mints it and only the API accepts it; it never leaves the
 * server, so nothing outside can act as Agent Worker.
 */
@Injectable()
export class AgentWorkerTokenService {
  private readonly token: InternalToken;

  constructor(config: AppConfigService) {
    this.token = new InternalToken({
      secret: config.authSecret,
      keyContext: AGENT_WORKER_TOKEN_KEY_CONTEXT,
      issuer: AGENT_WORKER_TOKEN_ISSUER,
      audience: AGENT_WORKER_TOKEN_AUDIENCE,
      ttlSeconds: AGENT_WORKER_TOKEN_TTL_SECONDS,
    });
  }

  issue(scope: AgentWorkerScope): Promise<string> {
    return this.token.issue(scope.userId, {
      [AGENT_WORKER_WORKSPACE_CLAIM]: scope.workspaceId,
      [AGENT_WORKER_CONVERSATION_CLAIM]: scope.conversationId,
    });
  }

  /** The scope the token names, or null when it is forged, expired or malformed. */
  async verify(token: string): Promise<AgentWorkerScope | null> {
    const verified = await this.token.verify(token);
    if (!verified) return null;
    const workspaceId = verified.claims[AGENT_WORKER_WORKSPACE_CLAIM];
    const conversationId = verified.claims[AGENT_WORKER_CONVERSATION_CLAIM];
    if (typeof workspaceId !== 'string' || typeof conversationId !== 'string') return null;
    return { userId: verified.subject, workspaceId, conversationId };
  }
}
