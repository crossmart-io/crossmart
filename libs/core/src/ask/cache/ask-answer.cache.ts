import type { AskAnswer } from '../entities/ask-answer.js';

/** Recent answers by question, so the same question asked again costs nothing. */
export abstract class AskAnswerCache {
  abstract find(question: string): Promise<AskAnswer | null>;
  abstract save(question: string, answer: AskAnswer): Promise<void>;
}
