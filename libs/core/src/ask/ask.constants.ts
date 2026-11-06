// Plain files only: the MCP server imports these constants and must not load Nest modules.
import { REDIS_KEY_PREFIX } from '@crossmart/common/redis/redis.constants.js';
import { Feature } from '../entitlements/enums/feature.enum.js';

/** Question length bounds. Long questions cost tokens and are almost never needed. */
export const ASK_QUESTION_MIN_LENGTH = 3;
export const ASK_QUESTION_MAX_LENGTH = 500;

/** Knowledge chunks sent to the model with each question. */
export const ASK_RETRIEVED_CHUNKS = 6;
/**
 * The lowest retrieval score a chunk needs to be used. A question that matches nothing above it
 * is answered "I don't know" without calling the model, so off-topic traffic costs nothing.
 */
export const ASK_MIN_RELEVANCE_SCORE = 0.5;
/** Okapi BM25's term frequency saturation and length normalisation, at their usual values. */
export const BM25_K1 = 1.2;
export const BM25_B = 0.75;
/** How many times a chunk's title counts, as titles say what a section is about. */
export const TITLE_TERM_WEIGHT = 2;

/** Answer limits: the model writes short answers and cites at most this many sources. */
export const ASK_ANSWER_MAX_LENGTH = 2500;
export const ASK_ANSWER_MAX_WORDS = 250;
export const ASK_MAX_CITATIONS = 5;
/** Room for the model's reasoning plus a short answer. */
export const ASK_MAX_OUTPUT_TOKENS = 8000;
/** Ids the prompt gives sources: S1, S2, … */
export const SOURCE_ID_PREFIX = 'S';

/** How long the knowledge index (docs plus the plan lineup from the database) is reused. */
export const ASK_KNOWLEDGE_REFRESH_MS = 10 * 60 * 1000;
/** How long an answer is reused for the same question, so repeated questions cost nothing. */
export const ASK_ANSWER_CACHE_TTL_SECONDS = 6 * 60 * 60;
/** Questions counted per UTC day; the key lives a little longer than the day it counts. */
export const ASK_BUDGET_KEY_TTL_SECONDS = 2 * 24 * 60 * 60;
export const ASK_BUDGET_KEY_PREFIX = `${REDIS_KEY_PREFIX}ask:questions:`;
export const ASK_ANSWER_KEY_PREFIX = `${REDIS_KEY_PREFIX}ask:answer:`;

/** The public pages Ask points to. */
export const DOCS_URL = 'https://docs.crossmart.io';
export const PRICING_URL = 'https://crossmart.io/pricing';
export const PLANS_CHUNK_ID = 'plans:offered';
export const PLANS_CHUNK_TITLE = 'Crossmart Cloud plans and what each includes';

/** How a plan limit reads when its period matters ("300 AI credits a month"). */
export const FEATURE_PERIOD_SUFFIXES: Partial<Record<Feature, string>> = {
  [Feature.AiCredits]: ' a month',
};
export const UNLIMITED_LABEL = 'unlimited';
export const INCLUDED_LABEL = 'included';
export const NOT_INCLUDED_LABEL = 'not included';
export const NUMBER_LOCALE = 'en-US';

export const ASK_TURNED_OFF_MESSAGE = 'Ask Crossmart is turned off on this server.';

/** What Ask says when the sources do not answer the question. */
export function askHandoffMessage(supportEmail: string): string {
  return (
    'I don’t know the answer from Crossmart’s documentation. ' +
    `Email ${supportEmail} and a person will help, or browse ${DOCS_URL}.`
  );
}

/** What Ask says to questions that are not about Crossmart. */
export const ASK_OUT_OF_SCOPE_MESSAGE =
  'I can only answer questions about Crossmart: what it does, its plans, and how to use its ' +
  'dashboard, API, SDKs and MCP server.';

/** Why Ask is not answering right now, once the day's questions are spent. */
export function askDailyLimitMessage(supportEmail: string): string {
  return (
    'Ask Crossmart has answered all the questions it can today. ' +
    `Browse ${DOCS_URL}, or email ${supportEmail}.`
  );
}
