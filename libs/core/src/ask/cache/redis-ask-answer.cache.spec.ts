import type { Redis } from 'ioredis';
import { ASK_PROMPT_VERSION } from '../../ai/prompts/ask.v2.prompt.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { questionKey, RedisAskAnswerCache } from './redis-ask-answer.cache.js';

const ANSWER = {
  outcome: AskOutcome.Answered,
  answer: 'Yes.',
  citations: [{ title: 'Docs', url: 'https://docs.example' }],
  confidence: AskConfidence.High,
  handoff: false,
  supportEmail: 'help@example.com',
};

function fakeRedis() {
  const store = new Map<string, string>();
  const redis = {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
  };
  return { store, cache: new RedisAskAnswerCache(redis as unknown as Redis), redis };
}

describe('RedisAskAnswerCache', () => {
  it('shares an answer between questions that differ only in case and spacing', async () => {
    const { cache } = fakeRedis();

    await cache.save('What is  Crossmart?', ANSWER);

    expect(await cache.find(' what is crossmart? ')).toEqual(ANSWER);
  });

  it('stores a hash of the question, never the question, with an expiry', async () => {
    const { cache, redis } = fakeRedis();

    await cache.save('my secret question', ANSWER);

    const [key, , mode, ttl] = redis.set.mock.calls[0] as unknown as [
      string,
      string,
      string,
      number,
    ];
    expect(key).toBe(questionKey('my secret question'));
    expect(key).not.toContain('secret');
    expect(key).toContain(ASK_PROMPT_VERSION);
    expect(mode).toBe('EX');
    expect(ttl).toBeGreaterThan(0);
  });

  it('ignores entries that do not parse', async () => {
    const { cache, store } = fakeRedis();
    store.set(questionKey('q'), '{"outcome":"nope"}');
    store.set(questionKey('broken'), 'not json');

    expect(await cache.find('q')).toBeNull();
    expect(await cache.find('broken')).toBeNull();
  });
});
