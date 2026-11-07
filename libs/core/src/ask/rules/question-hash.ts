import { createHash } from 'node:crypto';

const HASH_ALGORITHM = 'sha256';
const HASH_ENCODING = 'hex';
const WHITESPACE_RUN = /\s+/g;
const SPACE = ' ';

/** A SHA-256 of the question ignoring case and spacing, so questions asked alike share it. */
export function questionHash(question: string): string {
  const normalized = question.trim().toLowerCase().replace(WHITESPACE_RUN, SPACE);
  return createHash(HASH_ALGORITHM).update(normalized).digest(HASH_ENCODING);
}
