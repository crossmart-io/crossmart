import type { AskAnswer } from '../entities/ask-answer.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { AskAnswerCache } from '../cache/ask-answer.cache.js';
import { AskDailyBudget } from '../cache/ask-daily-budget.js';
import { KnowledgeSource } from '../sources/knowledge-source.js';

/** An answer cache in memory, keyed by the exact question, for tests. */
export class InMemoryAskAnswerCache extends AskAnswerCache {
  readonly answers = new Map<string, AskAnswer>();

  find(question: string): Promise<AskAnswer | null> {
    return Promise.resolve(this.answers.get(question) ?? null);
  }

  save(question: string, answer: AskAnswer): Promise<void> {
    this.answers.set(question, answer);
    return Promise.resolve();
  }
}

/** A daily budget in memory, for tests. */
export class InMemoryAskDailyBudget extends AskDailyBudget {
  taken = 0;

  tryTake(cap: number): Promise<boolean> {
    this.taken += 1;
    return Promise.resolve(this.taken <= cap);
  }
}

/** A knowledge source with fixed chunks, for tests. */
export class FixedKnowledgeSource extends KnowledgeSource {
  constructor(private readonly fixed: readonly KnowledgeChunk[]) {
    super();
  }

  chunks(): Promise<readonly KnowledgeChunk[]> {
    return Promise.resolve(this.fixed);
  }
}
