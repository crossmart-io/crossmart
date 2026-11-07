import { Injectable } from '@nestjs/common';
import { AskAnswerCache } from '../cache/ask-answer.cache.js';
import { AskDailyBudget } from '../cache/ask-daily-budget.js';
import { AskQuota } from '../cache/ask-quota.js';
import { ASK_ACCOUNT_QUESTIONS_PER_DAY, ASK_ACCOUNT_QUOTA_KEY_PREFIX } from '../ask.constants.js';
import type { AskAnswer } from '../entities/ask-answer.js';
import { AskAccountLimitReachedError, AskDailyLimitReachedError } from '../errors/ask.errors.js';

/**
 * What keeps Ask's bill bounded besides rate limits: recent answers are reused, the platform
 * answers at most a fixed number of questions a day, and each workspace a fixed number of
 * questions about its account.
 */
@Injectable()
export class AskSpendControls {
  constructor(
    private readonly cache: AskAnswerCache,
    private readonly budget: AskDailyBudget,
    private readonly quota: AskQuota,
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

  /** Takes one account question from the workspace's day, or throws once they are spent. */
  async takeAccountQuestion(workspaceId: string, now: Date): Promise<void> {
    const allowed = await this.quota.tryTake(
      ASK_ACCOUNT_QUOTA_KEY_PREFIX,
      workspaceId,
      ASK_ACCOUNT_QUESTIONS_PER_DAY,
      now,
    );
    if (!allowed) throw new AskAccountLimitReachedError();
  }
}
