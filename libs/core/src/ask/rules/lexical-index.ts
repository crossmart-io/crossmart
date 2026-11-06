import { BM25_B, BM25_K1 } from '../ask.constants.js';
import { searchTerms } from './search-terms.js';

/** A document as the index sees it: an id and the text it is searched by. */
export interface IndexableDocument {
  id: string;
  /** The text to search; repeat words (such as a title) to weigh them more. */
  searchText: string;
}

export interface ScoredDocument<Document> {
  document: Document;
  score: number;
}

interface IndexedEntry<Document> {
  document: Document;
  termCounts: Map<string, number>;
  length: number;
}

const IDF_SMOOTHING = 0.5;

function countTerms(terms: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1);
  return counts;
}

/**
 * Okapi BM25 over a small, fixed set of documents, in memory. Lexical retrieval is enough for
 * Crossmart's docs (ADR 0022): they use the words people ask with, and it needs no embedding
 * model, no vector store and no per-question cost.
 */
export class LexicalIndex<Document extends IndexableDocument> {
  private readonly entries: IndexedEntry<Document>[];
  private readonly documentFrequency = new Map<string, number>();
  private readonly averageLength: number;

  constructor(documents: readonly Document[]) {
    this.entries = documents.map((document) => {
      const terms = searchTerms(document.searchText);
      return { document, termCounts: countTerms(terms), length: terms.length };
    });
    for (const entry of this.entries) {
      for (const term of entry.termCounts.keys()) {
        this.documentFrequency.set(term, (this.documentFrequency.get(term) ?? 0) + 1);
      }
    }
    const totalLength = this.entries.reduce((sum, entry) => sum + entry.length, 0);
    this.averageLength = this.entries.length ? totalLength / this.entries.length : 0;
  }

  get size(): number {
    return this.entries.length;
  }

  /** The best `limit` documents scoring at least `minScore`, best first. */
  search(query: string, limit: number, minScore: number): ScoredDocument<Document>[] {
    const queryTerms = [...new Set(searchTerms(query))];
    if (!queryTerms.length) return [];
    return this.entries
      .map((entry) => ({ document: entry.document, score: this.score(entry, queryTerms) }))
      .filter((scored) => scored.score >= minScore)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private score(entry: IndexedEntry<Document>, queryTerms: readonly string[]): number {
    const lengthRatio = this.averageLength ? entry.length / this.averageLength : 0;
    const normalisation = BM25_K1 * (1 - BM25_B + BM25_B * lengthRatio);
    return queryTerms.reduce((total, term) => {
      const frequency = entry.termCounts.get(term) ?? 0;
      if (!frequency) return total;
      const saturation = (frequency * (BM25_K1 + 1)) / (frequency + normalisation);
      return total + this.inverseDocumentFrequency(term) * saturation;
    }, 0);
  }

  /** Rare terms count more. The `+ 1` keeps it positive for terms in most documents. */
  private inverseDocumentFrequency(term: string): number {
    const containing = this.documentFrequency.get(term) ?? 0;
    return Math.log(
      1 + (this.entries.length - containing + IDF_SMOOTHING) / (containing + IDF_SMOOTHING),
    );
  }
}
