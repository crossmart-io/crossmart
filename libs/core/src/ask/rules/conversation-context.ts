import {
  ASK_CHARS_PER_TOKEN,
  ASK_CONTEXT_MAX_TOKENS,
  ASK_CONTEXT_MAX_TURNS,
  ASK_RETRIEVAL_CONTEXT_QUESTIONS,
} from '../ask.constants.js';
import type { AskContextTurn } from '../entities/ask-context.js';

const QUERY_SEPARATOR = ' ';

function estimatedTokens(turn: AskContextTurn): number {
  return Math.ceil((turn.question.length + turn.answer.length) / ASK_CHARS_PER_TOKEN);
}

/**
 * The earlier turns sent with a follow-up: the latest `ASK_CONTEXT_MAX_TURNS`, newest kept
 * first while they fit `ASK_CONTEXT_MAX_TOKENS`, returned oldest first as they happened.
 */
export function boundedContext(history: readonly AskContextTurn[]): AskContextTurn[] {
  const kept: AskContextTurn[] = [];
  let tokens = 0;
  for (const turn of history.slice(-ASK_CONTEXT_MAX_TURNS).reverse()) {
    tokens += estimatedTokens(turn);
    if (tokens > ASK_CONTEXT_MAX_TOKENS) break;
    kept.unshift(turn);
  }
  return kept;
}

/**
 * What retrieval searches for: the question plus the latest earlier questions, so a follow-up
 * such as "and on eBay?" still finds the pages about what it follows up on.
 */
export function retrievalQuery(question: string, history: readonly AskContextTurn[]): string {
  const earlier = history.slice(-ASK_RETRIEVAL_CONTEXT_QUESTIONS).map((turn) => turn.question);
  return [...earlier, question].join(QUERY_SEPARATOR);
}
