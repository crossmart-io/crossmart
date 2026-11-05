import { forEachLimited } from './for-each-limited.js';

describe('forEachLimited', () => {
  it('runs every item with at most the limit at once', async () => {
    let running = 0;
    let peak = 0;
    const done: number[] = [];

    await forEachLimited([1, 2, 3, 4, 5], 2, async (item) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      done.push(item);
      running -= 1;
    });

    expect(done.toSorted((left, right) => left - right)).toEqual([1, 2, 3, 4, 5]);
    expect(peak).toBe(2);
  });

  it('rejects with the first failure once started tasks settle', async () => {
    const started: number[] = [];

    await expect(
      forEachLimited([1, 2, 3], 3, async (item) => {
        started.push(item);
        if (item === 2) throw new Error('failed 2');
      }),
    ).rejects.toThrow('failed 2');
    expect(started).toEqual([1, 2, 3]);
  });

  it('does nothing for no items', async () => {
    await expect(forEachLimited([], 2, () => Promise.reject(new Error('never')))).resolves.toBe(
      undefined,
    );
  });
});
