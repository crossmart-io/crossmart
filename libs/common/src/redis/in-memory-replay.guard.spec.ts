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
});
