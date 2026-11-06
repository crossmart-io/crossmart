import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { ASK_ANSWER_CACHE_TTL_SECONDS, ASK_ANSWER_KEY_PREFIX } from '../ask.constants.js';
import type { AskAnswer } from '../entities/ask-answer.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { AskAnswerCache } from './ask-answer.cache.js';

const HASH_ALGORITHM = 'sha256';
const HASH_ENCODING = 'hex';
const WHITESPACE_RUN = /\s+/g;
const SPACE = ' ';
const EXPIRE_IN_SECONDS = 'EX';

const cachedAnswerSchema: z.ZodType<AskAnswer> = z.object({
  outcome: z.enum(AskOutcome),
  answer: z.string(),
  citations: z.array(z.object({ title: z.string(), url: z.string() })),
  confidence: z.enum(AskConfidence),
  handoff: z.boolean(),
  supportEmail: z.string(),
});

/** Questions that differ only in case or spacing share an answer. */
export function questionKey(question: string): string {
  const normalized = question.trim().toLowerCase().replace(WHITESPACE_RUN, SPACE);
  const digest = createHash(HASH_ALGORITHM).update(normalized).digest(HASH_ENCODING);
  return `${ASK_ANSWER_KEY_PREFIX}${digest}`;
}

/**
 * Answers in Redis under a hash of the question, so the question itself is never stored. An
 * entry that no longer parses (written by another version) is ignored.
 */
@Injectable()
export class RedisAskAnswerCache extends AskAnswerCache {
  constructor(private readonly redis: Redis) {
    super();
  }

  async find(question: string): Promise<AskAnswer | null> {
    const stored = await this.redis.get(questionKey(question));
    if (!stored) return null;
    const parsed = cachedAnswerSchema.safeParse(RedisAskAnswerCache.parseJson(stored));
    return parsed.success ? parsed.data : null;
  }

  async save(question: string, answer: AskAnswer): Promise<void> {
    await this.redis.set(
      questionKey(question),
      JSON.stringify(answer),
      EXPIRE_IN_SECONDS,
      ASK_ANSWER_CACHE_TTL_SECONDS,
    );
  }

  private static parseJson(stored: string): unknown {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
