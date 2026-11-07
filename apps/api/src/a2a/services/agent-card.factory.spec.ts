import type { AppConfigService } from '@crossmart/common';
import { A2aSkillId } from '../a2a.constants.js';
import { AgentCardFactory } from './agent-card.factory.js';

describe('AgentCardFactory', () => {
  const card = new AgentCardFactory({
    apiPublicUrl: 'https://api.crossmart.io',
    authBaseUrl: 'https://api.crossmart.io',
  } as AppConfigService).card('1.0.0');

  it('points to the JSON-RPC endpoint of this instance, for A2A 1.0', () => {
    expect(card.supportedInterfaces).toEqual([
      { url: 'https://api.crossmart.io/a2a', protocolBinding: 'JSONRPC', protocolVersion: '1.0' },
    ]);
  });

  it('declares no streaming or push, anonymous access, and the account skill’s own security', () => {
    expect(card.capabilities).toEqual({
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
    });
    expect(card.securityRequirements).toEqual([]);
    const account = card.skills.find((skill) => skill.id === A2aSkillId.AccountHelp);
    expect(account?.securityRequirements?.length).toBe(2);
  });

  it('names the provider and the OAuth server agents sign in with', () => {
    expect(card.provider.organization).toContain('YIOT LLC');
    expect(JSON.stringify(card.securitySchemes)).toContain(
      'https://api.crossmart.io/api/auth/oauth2/authorize',
    );
  });
});
