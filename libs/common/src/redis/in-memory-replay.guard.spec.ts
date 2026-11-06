import { InMemoryReplayGuard } from './in-memory-replay.guard.js';

describe('InMemoryReplayGuard', () => {
  it('accepts a key once until it expires', async () => {
    let now = 1_000;
    const guard = new InMemoryReplayGuard(() => now);

    expect(await guard.claim('nonce', 500)).toBe(true);
    expect(await guard.claim('nonce', 500)).toBe(false);
    expect(await guard.claim('other', 500)).toBe(true);
    now += 500;
    expect(await guard.claim('nonce', 500)).toBe(true);
  });

  it('accepts a released key again', async () => {
    const guard = new InMemoryReplayGuard();
    await guard.claim('delivery', 1000);

    await guard.release('delivery');

    expect(await guard.claim('delivery', 1000)).toBe(true);
  });
});
