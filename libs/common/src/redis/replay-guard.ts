/**
 * Remembers one-time values (OAuth nonces, webhook delivery ids) for a while, so each is
 * accepted once. Shared by every API instance when backed by Redis.
 */
export abstract class ReplayGuard {
  /**
   * Records `key` for `ttlMs`. True the first time it is claimed in that window, false when it
   * was already claimed: the caller then refuses it as a replay.
   */
  abstract claim(key: string, ttlMs: number): Promise<boolean>;

  /** Forgets a claim, so the value is accepted again, such as when handling it failed. */
  abstract release(key: string): Promise<void>;
}
