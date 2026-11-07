import { Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';
import { AppConfigService, hmacSha256 } from '@crossmart/common';
import {
  AGENT_WORKER_CONVERSATION_CLAIM,
  AGENT_WORKER_TOKEN_ALGORITHM,
  AGENT_WORKER_TOKEN_AUDIENCE,
  AGENT_WORKER_TOKEN_ISSUER,
  AGENT_WORKER_TOKEN_KEY_CONTEXT,
  AGENT_WORKER_TOKEN_TTL_SECONDS,
  AGENT_WORKER_WORKSPACE_CLAIM,
} from '../agent-worker.constants.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';

const SECONDS_SUFFIX = 's';

/**
 * Agent Worker's credential for its own calls to the API: a JWT naming the person, workspace and
 * conversation, valid for two minutes and signed with a key derived from `BETTER_AUTH_SECRET`
 * for this purpose only. Only the API mints it and only the API accepts it; it never leaves the
 * server, so nothing outside can act as Agent Worker.
 */
@Injectable()
export class AgentWorkerTokenService {
  private readonly key: Uint8Array;

  constructor(config: AppConfigService) {
    this.key = Buffer.from(
      hmacSha256(config.authSecret, AGENT_WORKER_TOKEN_KEY_CONTEXT, 'hex'),
      'hex',
    );
  }

  issue(scope: AgentWorkerScope): Promise<string> {
    return new SignJWT({
      [AGENT_WORKER_WORKSPACE_CLAIM]: scope.workspaceId,
      [AGENT_WORKER_CONVERSATION_CLAIM]: scope.conversationId,
    })
      .setProtectedHeader({ alg: AGENT_WORKER_TOKEN_ALGORITHM })
      .setSubject(scope.userId)
      .setIssuer(AGENT_WORKER_TOKEN_ISSUER)
      .setAudience(AGENT_WORKER_TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${AGENT_WORKER_TOKEN_TTL_SECONDS}${SECONDS_SUFFIX}`)
      .sign(this.key);
  }

  /** The scope the token names, or null when it is forged, expired or malformed. */
  async verify(token: string): Promise<AgentWorkerScope | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [AGENT_WORKER_TOKEN_ALGORITHM],
        audience: AGENT_WORKER_TOKEN_AUDIENCE,
        issuer: AGENT_WORKER_TOKEN_ISSUER,
      });
      const workspaceId = payload[AGENT_WORKER_WORKSPACE_CLAIM];
      const conversationId = payload[AGENT_WORKER_CONVERSATION_CLAIM];
      if (!payload.sub || typeof workspaceId !== 'string' || typeof conversationId !== 'string') {
        return null;
      }
      return { userId: payload.sub, workspaceId, conversationId };
    } catch {
      return null;
    }
  }
}
