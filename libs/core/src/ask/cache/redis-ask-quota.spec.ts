import type { Redis } from 'ioredis';
import { ASK_ESCALATION_QUOTA_KEY_PREFIX } from '../ask.constants.js';
import { RedisAskQuota } from './redis-ask-quota.js';

function quotaCounting(taken: number) {
  const evalScript = vi.fn().mockResolvedValue(taken);
  return { quota: new RedisAskQuota({ eval: evalScript } as unknown as Redis), evalScript };
}

describe('RedisAskQuota', () => {
  it('counts per key and UTC date, and allows within the cap', async () => {
    const { quota, evalScript } = quotaCounting(5);

    expect(
      await quota.tryTake(
        ASK_ESCALATION_QUOTA_KEY_PREFIX,
        'owner',
        5,
        new Date('2026-11-07T23:00:00Z'),
      ),
    ).toBe(true);
    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'crossmart:ask:escalations:owner:2026-11-07',
      expect.any(Number),
    );
  });

  it('refuses past the cap', async () => {
    const { quota } = quotaCounting(6);

    expect(await quota.tryTake(ASK_ESCALATION_QUOTA_KEY_PREFIX, 'owner', 5, new Date())).toBe(
      false,
    );
  });
});
