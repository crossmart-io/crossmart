import { agentClientName } from './agent-client-name.js';

describe('agentClientName', () => {
  it('prefers the name the agent gives', () => {
    expect(agentClientName('https://claude.ai/oauth/client.json', ' Claude ')).toBe('Claude');
  });

  it('falls back to the metadata document’s host, then to the id', () => {
    expect(agentClientName('https://chatgpt.com/oauth/client.json', null)).toBe('chatgpt.com');
    expect(agentClientName('abc123', '')).toBe('abc123');
  });
});
