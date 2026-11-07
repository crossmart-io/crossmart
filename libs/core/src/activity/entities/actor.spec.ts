import { ActivityActorType } from '@crossmart/database';
import { Actor, AGENT_WORKER_NAME } from './actor.js';

describe('Actor', () => {
  it.each([
    Actor.user('user-1'),
    Actor.apiKey('key-1'),
    Actor.agent('user-1', 'https://claude.ai/oauth/mcp-oauth-client-metadata'),
    Actor.agentWorker('user-1'),
    Actor.system(),
  ])('survives a trip through a background job as plain data', (actor) => {
    expect(Actor.from(JSON.parse(JSON.stringify(actor.toRef())))).toEqual(actor);
  });

  it('falls back to the system for a reference without the id its type needs', () => {
    expect(Actor.from({ type: ActivityActorType.USER, userId: null, apiKeyId: null })).toEqual(
      Actor.system(),
    );
  });

  it('falls back to the system for an agent reference without its client', () => {
    expect(Actor.from({ type: ActivityActorType.AGENT, userId: 'user-1', apiKeyId: null })).toEqual(
      Actor.system(),
    );
  });

  it('names Agent Worker, which has no OAuth client, and acts for its user', () => {
    const actor = Actor.agentWorker('user-1');
    expect(actor).toMatchObject({
      type: ActivityActorType.AGENT,
      userId: 'user-1',
      agentClientId: null,
      agentName: AGENT_WORKER_NAME,
    });
  });

  it('never turns another built-in agent name into Agent Worker', () => {
    const ref = { type: ActivityActorType.AGENT, userId: 'user-1', apiKeyId: null, agentName: 'X' };
    expect(Actor.from(ref)).toEqual(Actor.system());
  });
});
