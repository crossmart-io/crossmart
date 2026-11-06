import { LocalRateLimitWindows } from './local-rate-limit-windows.js';

const RULE = { window: 60, max: 2 };

function windowsAt(start: number, maxWindows = 100) {
  const clock = { now: start };
  return { clock, windows: new LocalRateLimitWindows(maxWindows, () => clock.now) };
}

describe('LocalRateLimitWindows', () => {
  it('allows requests up to the limit, then says when the window ends', () => {
    const { clock, windows } = windowsAt(1_000_000);

    expect(windows.consume('1.2.3.4|/sign-in/email', RULE).allowed).toBe(true);
    expect(windows.consume('1.2.3.4|/sign-in/email', RULE).allowed).toBe(true);
    clock.now += 15_500;

    expect(windows.consume('1.2.3.4|/sign-in/email', RULE)).toEqual({
      allowed: false,
      retryAfter: 45,
    });
  });

  it('counts each key on its own', () => {
    const { windows } = windowsAt(0);
    windows.consume('a|/token', RULE);
    windows.consume('a|/token', RULE);

    expect(windows.consume('b|/token', RULE).allowed).toBe(true);
  });

  it('starts a new window once the old one ends', () => {
    const { clock, windows } = windowsAt(0);
    windows.consume('a|/token', RULE);
    windows.consume('a|/token', RULE);
    clock.now += 60_000;

    expect(windows.consume('a|/token', RULE).allowed).toBe(true);
  });

  it('forgets the oldest windows beyond its capacity', () => {
    const { windows } = windowsAt(0, 2);
    windows.consume('a|/token', { window: 60, max: 1 });
    windows.consume('b|/token', RULE);
    windows.consume('c|/token', RULE);

    expect(windows.consume('a|/token', { window: 60, max: 1 }).allowed).toBe(true);
  });
});
