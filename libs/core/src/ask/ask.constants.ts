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
/**
 * Added to a chunk's score in proportion to how closely its heading matches the question's
 * words (their Jaccard similarity), so "Which marketplaces does Crossmart support?" finds the
 * section with that heading even though "Crossmart" is on every page.
 */
export const HEADING_MATCH_WEIGHT = 2;
/** Overview pages win ties with detailed ones, so broad questions get the big picture. */
export const OVERVIEW_BOOST = 1.5;
/** Between a page's title and its section's heading in a chunk title: "Page › Section". */
export const CHUNK_TITLE_SEPARATOR = ' › ';

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
export const SITE_URL = 'https://crossmart.io';
export const DOCS_URL = 'https://docs.crossmart.io';
export const PRICING_URL = `${SITE_URL}/#pricing`;
/**
 * The only hosts Ask cites. Every source must be a public page people can open; the backend
 * repository is private for now, so its documents are not sources.
 */
export const PUBLIC_CITATION_HOSTS: readonly string[] = ['docs.crossmart.io', 'crossmart.io'];
/**
 * Overview pages (the channel list, the FAQ, the docs' introductions and the plans), boosted by
 * `OVERVIEW_BOOST`. Only the chunk at exactly this URL is boosted, not the page's other sections.
 */
export const OVERVIEW_URLS: ReadonlySet<string> = new Set([
  `${SITE_URL}/#channels`,
  `${SITE_URL}/#faq`,
  `${SITE_URL}/#hosting`,
  PRICING_URL,
  `${DOCS_URL}/`,
  `${DOCS_URL}/developers/`,
]);
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

// ─── Conversations (ADR 0025) ────────────────────────────────────────────────

const MS_PER_HOUR = 60 * 60 * 1000;

/** Random bytes in a conversation id and an escalation ticket id (256 bits): unguessable. */
export const ASK_TOKEN_BYTES = 32;
/** Conversation ids start with this, so they are easy to tell apart from ticket ids. */
export const ASK_CONVERSATION_ID_PREFIX = 'conv_';
/** Escalation ticket ids start with this. The id is also the capability to read the ticket. */
export const ASK_ESCALATION_ID_PREFIX = 'esc_';
/** The longest conversation or ticket id a caller can send (prefix plus base64url bytes). */
export const ASK_TOKEN_MAX_LENGTH = 64;
/** A conversation with no new question for this long expires and cannot be continued. */
export const ASK_CONVERSATION_IDLE_MS = 24 * MS_PER_HOUR;
/** Questions one conversation may hold; past it, the caller starts a new one. */
export const ASK_CONVERSATION_MAX_TURNS = 30;
/** Earlier turns sent to the model with a follow-up question, at most. */
export const ASK_CONTEXT_MAX_TURNS = 4;
/** Earlier turns are cut to fit about this many tokens, newest kept first. */
export const ASK_CONTEXT_MAX_TOKENS = 1200;
/** A rough count of characters per token, to bound the context without a tokenizer. */
export const ASK_CHARS_PER_TOKEN = 4;
/** Earlier questions added to the retrieval query of a follow-up, so "and on eBay?" finds eBay. */
export const ASK_RETRIEVAL_CONTEXT_QUESTIONS = 2;

// ─── Storage and retention ───────────────────────────────────────────────────

/** Conversations, with their turns and escalations, are kept this long after their last turn. */
export const ASK_RETENTION_DAYS = 180;
/** Conversations deleted per statement, so retention never holds long locks. */
export const ASK_RETENTION_BATCH_SIZE = 1000;
/** Batches one retention run deletes at most; the next run picks up the rest. */
export const ASK_RETENTION_MAX_BATCHES = 50;
export const ASK_RETENTION_INTERVAL_MS = 24 * MS_PER_HOUR;
export const ASK_RETENTION_JOB_NAME = 'ask-retention';
export const ASK_RETENTION_SCHEDULER_ID = 'ask-retention';
/** What a redacted secret or address is replaced with in stored questions and answers. */
export const ASK_REDACTED = '[redacted]';
/** The salted hashes of callers are keyed with a key derived for this purpose only. */
export const ASK_HASH_KEY_CONTEXT = 'crossmart:ask:caller-hash:v1';
/** Escalation callbacks are signed with a per-ticket secret derived with this context. */
export const ASK_CALLBACK_SECRET_CONTEXT = 'crossmart:ask:escalation-callback:v1';

// ─── Escalation to a person ──────────────────────────────────────────────────

/** Escalations one caller may open per UTC day. Each one emails a person. */
export const ASK_ESCALATIONS_PER_DAY = 5;
export const ASK_ESCALATION_QUOTA_KEY_PREFIX = `${REDIS_KEY_PREFIX}ask:escalations:`;
export const ASK_REPLY_MAX_LENGTH = 5000;
export const ASK_CALLBACK_URL_MAX_LENGTH = 2048;
/** The callback's event type, in its envelope and `Crossmart-Event-Type` header. */
export const ASK_ESCALATION_REPLIED_EVENT = 'ask.escalation.replied';
/** The admin page of one escalated conversation in the web app, linked from the email. */
export const ASK_ADMIN_CONVERSATION_PATH = '/admin/ask';
export const ASK_ESCALATION_NOT_FOUND = 'Escalation not found';
export const ASK_CONVERSATION_NOT_FOUND =
  'Conversation not found. It may have expired; start a new one without a conversationId.';
export const ASK_CONVERSATION_FULL =
  'This conversation is full. Start a new one without a conversationId.';
export const ASK_ESCALATION_LIMIT_MESSAGE =
  'You have asked for a person too many times today. Email the support address instead.';
export const ASK_ALREADY_REPLIED = 'This escalation already has a reply';
/** What Ask says when it offers a person. */
export const ASK_ESCALATION_OFFER_MESSAGE =
  'A person from the Crossmart team can follow up. Escalate this conversation to reach them.';

// ─── Account questions ───────────────────────────────────────────────────────

/** Account questions one workspace may ask per UTC day; each may cost two model calls. */
export const ASK_ACCOUNT_QUESTIONS_PER_DAY = 200;
export const ASK_ACCOUNT_QUOTA_KEY_PREFIX = `${REDIS_KEY_PREFIX}ask:account-questions:`;
/** Lookups the model may ask for in one answer. */
export const ASK_MAX_ACCOUNT_LOOKUPS = 3;
/** Products a listing-status lookup reports at most. */
export const ASK_LOOKUP_PRODUCTS_LIMIT = 3;
/** Failed listings a lookup reports at most. */
export const ASK_LOOKUP_FAILED_LISTINGS_LIMIT = 10;
export const ASK_LOOKUP_QUERY_MAX_LENGTH = 100;
/** Ids account data has in the prompt: A1, A2, … */
export const ACCOUNT_SOURCE_ID_PREFIX = 'A';
/** The quota keys of a day live a little longer than the day they count. */
export const ASK_QUOTA_KEY_TTL_SECONDS = 2 * 24 * 60 * 60;
export const ASK_ACCOUNT_LIMIT_MESSAGE =
  'This workspace has asked Ask Crossmart about its account too many times today. Try again tomorrow.';
