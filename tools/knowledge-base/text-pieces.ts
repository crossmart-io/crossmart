import { MAX_CHUNK_LENGTH } from './knowledge-base.constants.js';

const PARAGRAPH_BREAK = '\n\n';
const LINE_BREAK = '\n';

/** Joins parts while they fit under the limit; a part over it is cut at line breaks. */
function pack(parts: readonly string[], separator: string, limit: number): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const part of parts) {
    const candidate = current ? `${current}${separator}${part}` : part;
    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }
    if (current) pieces.push(current);
    current = part;
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * A section's text in pieces of at most `limit` characters, cut between paragraphs, or between
 * lines for a paragraph (such as a long table) that is too long by itself.
 */
export function splitText(text: string, limit = MAX_CHUNK_LENGTH): string[] {
  return pack(text.split(PARAGRAPH_BREAK), PARAGRAPH_BREAK, limit).flatMap((piece) =>
    piece.length <= limit ? [piece] : pack(piece.split(LINE_BREAK), LINE_BREAK, limit),
  );
}
