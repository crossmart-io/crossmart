import { AgentClientRegistration } from '../enums/agent-client-registration.enum.js';
import { toAgentClientProfile } from './agent-client-profile.js';

describe('toAgentClientProfile', () => {
  it('verifies the host a metadata document came from, whatever site the agent claims', () => {
    expect(
      toAgentClientProfile({
        clientId: 'https://claude.ai/oauth/client.json',
        name: 'Claude',
        uri: 'https://claude.ai',
        clientDiscoveryId: 'cimd',
      }),
    ).toEqual({
      clientId: 'https://claude.ai/oauth/client.json',
      name: 'Claude',
      registration: AgentClientRegistration.MetadataDocument,
      verifiedHost: 'claude.ai',
      claimedHost: null,
    });
  });

  it('marks a self-registered client’s name and site as only claimed', () => {
    expect(
      toAgentClientProfile({
        clientId: 'aBcD1234',
        name: 'Claude',
        uri: 'https://claude.ai',
        clientDiscoveryId: null,
      }),
    ).toEqual({
      clientId: 'aBcD1234',
      name: 'Claude',
      registration: AgentClientRegistration.Dynamic,
      verifiedHost: null,
      claimedHost: 'claude.ai',
    });
  });

  it('claims no site that is not HTTPS', () => {
    const profile = toAgentClientProfile({
      clientId: 'aBcD1234',
      name: null,
      uri: 'http://claude.ai',
      clientDiscoveryId: null,
    });

    expect(profile).toMatchObject({ name: 'aBcD1234', claimedHost: null });
  });

  it('trusts no host for a URL-shaped id that was not fetched as a metadata document', () => {
    const profile = toAgentClientProfile({
      clientId: 'https://claude.ai/oauth/client.json',
      name: 'Claude',
      uri: null,
      clientDiscoveryId: null,
    });

    expect(profile).toMatchObject({
      registration: AgentClientRegistration.Dynamic,
      verifiedHost: null,
    });
  });
});
