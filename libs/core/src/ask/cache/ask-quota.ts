/** Counts what one key (a caller, a workspace) used per UTC day, across every API instance. */
export abstract class AskQuota {
  /** Takes one for `key` today; false when `cap` were already taken. */
  abstract tryTake(keyPrefix: string, key: string, cap: number, now: Date): Promise<boolean>;
}
