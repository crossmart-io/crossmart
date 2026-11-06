import { Injectable } from '@nestjs/common';
import { AskAnswerCache } from '../cache/ask-answer.cache.js';
import { AskDailyBudget } from '../cache/ask-daily-budget.js';
import type { AskAnswer } from '../entities/ask-answer.js';
import { AskDailyLimitReachedError } from '../errors/ask.errors.js';

/**
 * What keeps Ask's bill bounded besides rate limits: recent answers are reused, and the
 * platform answers at most a fixed number of questions a day.
 */
@Injectable()
export class AskSpendControls {
  constructor(
    private readonly cache: AskAnswerCache,
    private readonly budget: AskDailyBudget,
  ) {}

  cachedAnswer(question: string): Promise<AskAnswer | null> {
    return this.cache.find(question);
  }

  remember(question: string, answer: AskAnswer): Promise<void> {
    return this.cache.save(question, answer);
  }

  /** Takes one question from today's budget, or throws once `cap` were answered today. */
  async takeQuestion(cap: number, supportEmail: string, now: Date): Promise<void> {
    if (!(await this.budget.tryTake(cap, now))) {
      throw new AskDailyLimitReachedError(supportEmail);
    }
  }
}
