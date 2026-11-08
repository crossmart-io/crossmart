import type { AppConfigService } from '@crossmart/common';
import { AgentWorkerTokenService } from '../../agent-worker/services/agent-worker-token.service.js';
import { AgentProposalTokenService } from './agent-proposal-token.service.js';

const config = { authSecret: 'a-test-secret-that-is-long-enough' } as AppConfigService;
const GRANT = { workspaceId: 'ws-1', proposalId: 'p-1', approvedByUserId: 'u-1' };

describe('AgentProposalTokenService', () => {
  it('names the proposal and the person who approved it', async () => {
    const tokens = new AgentProposalTokenService(config);
    expect(await tokens.verify(await tokens.issue(GRANT))).toEqual(GRANT);
  });

  it('refuses tokens it did not mint, including Agent Worker’s', async () => {
    const tokens = new AgentProposalTokenService(config);
    const workerToken = await new AgentWorkerTokenService(config).issue({
      workspaceId: 'ws-1',
      userId: 'u-1',
      conversationId: 'c-1',
    });
    const other = new AgentProposalTokenService({
      authSecret: 'another-secret',
    } as AppConfigService);

    expect(await tokens.verify(workerToken)).toBeNull();
    expect(await tokens.verify(await other.issue(GRANT))).toBeNull();
    expect(await tokens.verify('not-a-token')).toBeNull();
  });
});
