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

function foldPlural(word: string): string {
  return word.length >= MIN_PLURAL_LENGTH &&
    word.endsWith(PLURAL_SUFFIX) &&
    !word.endsWith(DOUBLE_S)
    ? word.slice(0, -1)
    : word;
}

/**
 * The words of a text as the lexical index compares them: lowercase letters and digits,
 * without stopwords, plurals folded to the singular ("listings" matches "listing").
 */
export function searchTerms(text: string): string[] {
  const words = text.normalize('NFKC').toLowerCase().match(WORD_PATTERN) ?? [];
  return words
    .filter((word) => word.length >= MIN_TERM_LENGTH && !STOPWORDS.has(word))
    .map(foldPlural);
}
