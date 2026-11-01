/** Accents split off by NFKD normalisation (é → e + ◌́). */
const COMBINING_MARKS = /\p{Mark}/gu;
const NON_ALPHANUMERIC_RUNS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;
const SLUG_SEPARATOR = '-';

/** Lowercase, ASCII-only, hyphen-separated: "Joe's Store!" → "joe-s-store". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUNS, SLUG_SEPARATOR)
    .replace(EDGE_HYPHENS, '');
}
