import { TimeoutError, withTimeout } from './with-timeout.js';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles with the work when it finishes in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 100)).resolves.toBe('done');
  });

  it('passes the work’s own failure on', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 100)).rejects.toThrow('boom');
  });

  it('rejects with a TimeoutError when the work takes too long', async () => {
    vi.useFakeTimers();
    const outcome = withTimeout(new Promise<never>(() => undefined), 250).catch(
      (error: unknown) => error,
    );

    await vi.advanceTimersByTimeAsync(250);

    expect(await outcome).toBeInstanceOf(TimeoutError);
  });
});
