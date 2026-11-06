import { Inject, Injectable, Logger } from '@nestjs/common';
import { describeError } from '@crossmart/common';
import {
  ASK_KNOWLEDGE_REFRESH_MS,
  ASK_MIN_RELEVANCE_SCORE,
  TITLE_TERM_WEIGHT,
} from '../ask.constants.js';
import type { KnowledgeChunk, RetrievedChunk } from '../entities/knowledge-chunk.js';
import { chunkRelevance } from '../rules/chunk-relevance.js';
import {
  type IndexableDocument,
  LexicalIndex,
  type ScoredDocument,
} from '../rules/lexical-index.js';
import { searchTerms } from '../rules/search-terms.js';
import { KNOWLEDGE_SOURCES, KnowledgeSource } from '../sources/knowledge-source.js';

interface IndexedChunk extends IndexableDocument {
  chunk: KnowledgeChunk;
}

interface BuiltIndex {
  index: LexicalIndex<IndexedChunk>;
  builtAt: number;
}

const TERM_SEPARATOR = ' ';
/** Every chunk is scored, then ranked with its heading and overview boost. */
const ANY_TEXT_SCORE = 0;

function toIndexed(chunk: KnowledgeChunk): IndexedChunk {
  const title = Array.from({ length: TITLE_TERM_WEIGHT }, () => chunk.title).join(TERM_SEPARATOR);
  return { id: chunk.id, chunk, searchText: `${title}${TERM_SEPARATOR}${chunk.text}` };
}

/**
 * Ask's knowledge: every source's chunks in one lexical index, rebuilt every few minutes so
 * a plan change shows up without a deploy. A source that fails is left out of that build and
 * logged, so the docs still answer while, say, the database is unreachable.
 */
@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private built: Promise<BuiltIndex> | null = null;

  constructor(@Inject(KNOWLEDGE_SOURCES) private readonly sources: readonly KnowledgeSource[]) {}

  /** The chunks that best match the question, best first; none when nothing is relevant. */
  async search(question: string, limit: number, now = Date.now()): Promise<RetrievedChunk[]> {
    const { index } = await this.currentIndex(now);
    const questionTerms = new Set(searchTerms(question));
    return index
      .search(question, index.size, ANY_TEXT_SCORE)
      .map((scored) => KnowledgeBaseService.ranked(questionTerms, scored))
      .filter((found) => found.score >= ASK_MIN_RELEVANCE_SCORE)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private static ranked(
    questionTerms: ReadonlySet<string>,
    { document, score }: ScoredDocument<IndexedChunk>,
  ): RetrievedChunk {
    return { chunk: document.chunk, score: chunkRelevance(questionTerms, document.chunk, score) };
  }

  private async currentIndex(now: number): Promise<BuiltIndex> {
    const current = this.built ? await this.built : null;
    if (current && now - current.builtAt < ASK_KNOWLEDGE_REFRESH_MS) return current;
    this.built = this.build(now);
    return this.built;
  }

  private async build(now: number): Promise<BuiltIndex> {
    const chunks = await Promise.all(this.sources.map((source) => this.chunksOf(source)));
    return { index: new LexicalIndex(chunks.flat().map(toIndexed)), builtAt: now };
  }

  private async chunksOf(source: KnowledgeSource): Promise<readonly KnowledgeChunk[]> {
    try {
      return await source.chunks();
    } catch (error) {
      this.logger.warn(
        `Knowledge source ${source.constructor.name} failed: ${describeError(error)}`,
      );
      return [];
    }
  }
}
