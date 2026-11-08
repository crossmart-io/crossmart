import { abortableDelay } from './abortable-delay.js';

describe('abortableDelay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves after the delay', async () => {
    let done = false;
    const waiting = abortableDelay(1000, new AbortController().signal).then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(done).toBe(true);
  });

  it('rejects as soon as the signal aborts, or at once when it already has', async () => {
    const controller = new AbortController();
    const waiting = abortableDelay(1000, controller.signal);
    controller.abort(new Error('stop'));

    await expect(waiting).rejects.toThrow('stop');
    await expect(abortableDelay(1000, controller.signal)).rejects.toThrow('stop');
  });
});
