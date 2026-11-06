import { Injectable } from '@nestjs/common';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import { DOCS_KNOWLEDGE_CHUNKS } from '../knowledge/docs-knowledge.generated.js';
import { KnowledgeSource } from './knowledge-source.js';

/**
 * The public documentation, chunked at build time by `pnpm knowledge:build` into a committed
 * file, so answers never depend on fetching the docs site.
 */
@Injectable()
export class DocsKnowledgeSource extends KnowledgeSource {
  chunks(): Promise<readonly KnowledgeChunk[]> {
    return Promise.resolve(DOCS_KNOWLEDGE_CHUNKS);
  }
}
