import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';

/** Somewhere Ask's public knowledge comes from. Never workspace data. */
export abstract class KnowledgeSource {
  /** Every chunk this source has now. */
  abstract chunks(): Promise<readonly KnowledgeChunk[]>;
}

/** The sources the knowledge base indexes, in one injection token. */
export const KNOWLEDGE_SOURCES = Symbol('KNOWLEDGE_SOURCES');
