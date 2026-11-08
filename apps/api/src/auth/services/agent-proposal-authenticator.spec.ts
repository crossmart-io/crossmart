import {
  type AgentAccessService,
  type AgentProposalRepository,
  type AgentProposalTokenService,
  AgentProposerKind,
  type ApiKeysService,
} from '@crossmart/core';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import { AgentProposalAuthenticator } from './agent-proposal-authenticator.js';

const GRANT = { workspaceId: 'ws-1', proposalId: 'p-1', approvedByUserId: 'lee' };
const IDENTITY = { userId: 'dana', clientId: 'c-1', clientName: 'Claude', workspaceId: 'ws-1' };

function setup(proposal: Record<string, unknown> | null, identity: unknown = IDENTITY) {
  const tokens = { verify: vi.fn(() => Promise.resolve(GRANT)) };
  const proposals = { findApplying: vi.fn(() => Promise.resolve(proposal)) };
  const agents = { authorize: vi.fn(() => Promise.resolve(identity)) };
  const apiKeys = { identify: vi.fn(() => Promise.resolve({ apiKeyId: 'k-1' })) };
  const authenticator = new AgentProposalAuthenticator(
    tokens as unknown as AgentProposalTokenService,
    proposals as unknown as AgentProposalRepository,
    agents as unknown as AgentAccessService,
    apiKeys as unknown as ApiKeysService,
  );
  return { authenticator, agents, apiKeys };
}

const OAUTH_PROPOSAL = {
  proposerKind: AgentProposerKind.OAuthAgent,
  userId: 'dana',
  oauthClientId: 'c-1',
  apiKeyId: null,
  workspaceId: 'ws-1',
  scopes: ['catalog:write', 'not-a-scope'],
};

describe('AgentProposalAuthenticator', () => {
  it('acts as the agent as it stands now, approved by the person', async () => {
    const { authenticator, agents } = setup(OAUTH_PROPOSAL);
    const principal = await authenticator.authenticate('token');

    expect(principal).toMatchObject({
      kind: PrincipalKind.Agent,
      clientName: 'Claude',
      approvedByUserId: 'lee',
    });
    expect(agents.authorize).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 'c-1', scopes: ['catalog:write'] }),
    );
  });

  it('refuses when the proposal is not being applied, or the agent is gone', async () => {
    expect(await setup(null).authenticator.authenticate('token')).toBeNull();
    expect(await setup(OAUTH_PROPOSAL, null).authenticator.authenticate('token')).toBeNull();
  });

  it('acts as the key for an MCP session’s proposal', async () => {
    const { authenticator, apiKeys } = setup({
      ...OAUTH_PROPOSAL,
      proposerKind: AgentProposerKind.ApiKey,
      oauthClientId: null,
      apiKeyId: 'k-1',
    });
    expect(await authenticator.authenticate('token')).toMatchObject({
      kind: PrincipalKind.ApiKey,
      approvedByUserId: 'lee',
    });
    expect(apiKeys.identify).toHaveBeenCalledWith('ws-1', 'k-1');
  });
});
