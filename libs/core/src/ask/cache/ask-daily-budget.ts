/** Counts the questions the platform pays for each UTC day, across every API instance. */
export abstract class AskDailyBudget {
  /** Takes one question from today's budget; false when `cap` questions were already taken. */
  abstract tryTake(cap: number, now: Date): Promise<boolean>;
}
