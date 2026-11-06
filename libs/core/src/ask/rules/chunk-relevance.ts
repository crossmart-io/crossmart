import {
  CHUNK_TITLE_SEPARATOR,
  HEADING_MATCH_WEIGHT,
  OVERVIEW_BOOST,
  OVERVIEW_URLS,
} from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { searchTerms } from './search-terms.js';

const NO_BOOST = 1;
const NO_MATCH = 0;

/** A chunk's own heading: the last part of "Page › Section", or the page title. */
export function chunkHeading(title: string): string {
  return title.split(CHUNK_TITLE_SEPARATOR).at(-1) ?? title;
}

/** How alike two sets of words are, from 0 (nothing shared) to 1 (the same words). */
function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const shared = [...left].filter((term) => right.has(term)).length;
  const union = new Set([...left, ...right]).size;
  return union ? shared / union : NO_MATCH;
}

/**
 * A chunk's relevance to a question: its text score (BM25), plus how closely its heading
 * matches the question, boosted for overview pages. Broad questions ("Which marketplaces does
 * Crossmart support?") then get the overview rather than a detail that shares a word.
 */
export function chunkRelevance(
  questionTerms: ReadonlySet<string>,
  chunk: KnowledgeChunk,
  textScore: number,
): number {
  const headingTerms = new Set(searchTerms(chunkHeading(chunk.title)));
  const headingScore = HEADING_MATCH_WEIGHT * jaccard(questionTerms, headingTerms);
  const boost = OVERVIEW_URLS.has(chunk.url) ? OVERVIEW_BOOST : NO_BOOST;
  return (textScore + headingScore) * boost;
}
