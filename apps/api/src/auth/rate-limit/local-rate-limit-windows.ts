import {
  decide,
  MS_PER_SECOND,
  type RateLimitDecision,
  type RateLimitRule,
} from './rate-limit-decision.js';

interface Window {
  hits: number;
  endsAt: number;
}

/**
 * Fixed rate-limit windows in this process only: the fallback while Redis cannot be reached.
 * Each instance then counts on its own, which still bounds every caller. At most `maxWindows`
 * are kept; the oldest go first, so an outage cannot grow memory without limit.
 */
export class LocalRateLimitWindows {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly maxWindows: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string, rule: RateLimitRule): RateLimitDecision {
    const current = this.now();
    const window = this.activeWindow(key, current) ?? this.open(key, rule, current);
    window.hits += 1;
    return decide(window.hits, rule, window.endsAt - current);
  }

  private activeWindow(key: string, current: number): Window | undefined {
    const window = this.windows.get(key);
    return window && window.endsAt > current ? window : undefined;
  }

  private open(key: string, rule: RateLimitRule, current: number): Window {
    this.windows.delete(key);
    this.evictOverflow();
    const window = { hits: 0, endsAt: current + rule.window * MS_PER_SECOND };
    this.windows.set(key, window);
    return window;
  }

  /** Maps keep insertion order, so the first keys are the oldest windows. */
  private evictOverflow(): void {
    for (const key of this.windows.keys()) {
      if (this.windows.size < this.maxWindows) return;
      this.windows.delete(key);
    }
  }
}
