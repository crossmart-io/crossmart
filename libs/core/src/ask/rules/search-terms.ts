const WORD_PATTERN = /[\p{L}\p{N}]+/gu;
const MIN_TERM_LENGTH = 2;
/** Plurals are folded only on words long enough not to be harmed ("api" ≠ "apis" stays true). */
const MIN_PLURAL_LENGTH = 4;
const PLURAL_SUFFIX = 's';
const DOUBLE_S = 'ss';

/** Words too common to tell sections apart. */
const STOPWORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'its',
  'me',
  'my',
  'of',
  'on',
  'or',
  'so',
  'that',
  'the',
  'their',
  'there',
  'this',
  'to',
  'was',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
]);

const CHANNEL_TERM = 'channel';
const PRICE_TERM = 'price';
const PLAN_TERM = 'plan';
const CONNECT_TERM = 'connect';

/**
 * Words people use for the same thing, folded (after plurals) to one term, so a question about
 * "marketplaces" finds the page about "channels" and the other way round.
 */
const SYNONYMS: ReadonlyMap<string, string> = new Map([
  ['marketplace', CHANNEL_TERM],
  ['store', CHANNEL_TERM],
  ['shop', CHANNEL_TERM],
  ['platform', CHANNEL_TERM],
  ['integration', CHANNEL_TERM],
  ['integrate', CHANNEL_TERM],
  ['connector', CHANNEL_TERM],
  ['pricing', PRICE_TERM],
  ['cost', PRICE_TERM],
  ['tier', PLAN_TERM],
  ['subscription', PLAN_TERM],
  ['connected', CONNECT_TERM],
  ['connecting', CONNECT_TERM],
  ['connection', CONNECT_TERM],
]);

function foldSynonym(word: string): string {
  return SYNONYMS.get(word) ?? word;
}

function foldPlural(word: string): string {
  return word.length >= MIN_PLURAL_LENGTH &&
    word.endsWith(PLURAL_SUFFIX) &&
    !word.endsWith(DOUBLE_S)
    ? word.slice(0, -1)
    : word;
}

/**
 * The words of a text as the lexical index compares them: lowercase letters and digits,
 * without stopwords, plurals folded to the singular ("listings" matches "listing") and synonyms
 * to one word ("marketplaces" matches "channel").
 */
export function searchTerms(text: string): string[] {
  const words = text.normalize('NFKC').toLowerCase().match(WORD_PATTERN) ?? [];
  return words
    .filter((word) => word.length >= MIN_TERM_LENGTH && !STOPWORDS.has(word))
    .map(foldPlural)
    .map(foldSynonym);
}
