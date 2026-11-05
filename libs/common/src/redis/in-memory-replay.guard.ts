import { ReplayGuard } from './replay-guard.js';

/** `ReplayGuard` in one process, for tests and single-instance tools. */
export class InMemoryReplayGuard extends ReplayGuard {
  private readonly expiries = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {
    super();
  }

  claim(key: string, ttlMs: number): Promise<boolean> {
    const current = this.now();
    const expiresAt = this.expiries.get(key);
    if (expiresAt !== undefined && expiresAt > current) {
      return Promise.resolve(false);
    }
    this.expiries.set(key, current + ttlMs);
    return Promise.resolve(true);
  }
}
