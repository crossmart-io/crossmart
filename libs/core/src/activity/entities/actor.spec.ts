import { ActivityActorType } from '@crossmart/database';
import { Actor } from './actor.js';

describe('Actor', () => {
  it.each([Actor.user('user-1'), Actor.apiKey('key-1'), Actor.system()])(
    'survives a trip through a background job as plain data',
    (actor) => {
      expect(Actor.from(JSON.parse(JSON.stringify(actor.toRef())))).toEqual(actor);
    },
  );

  it('falls back to the system for a reference without the id its type needs', () => {
    expect(Actor.from({ type: ActivityActorType.USER, userId: null, apiKeyId: null })).toEqual(
      Actor.system(),
    );
  });
});
