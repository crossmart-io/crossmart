import { ACCOUNT_SOURCE_ID_PREFIX, SOURCE_ID_PREFIX } from '../ask.constants.js';
import type { KnowledgeChunk } from '../entities/knowledge-chunk.js';
import type { PromptSource } from '../entities/prompt-source.js';

function numbered(prefix: string, chunks: readonly KnowledgeChunk[]): PromptSource[] {
  return chunks.map((chunk, position) => ({ id: `${prefix}${position + 1}`, chunk }));
}

/** Docs as the prompt numbers them: S1, S2, … */
export function docSources(chunks: readonly KnowledgeChunk[]): PromptSource[] {
  return numbered(SOURCE_ID_PREFIX, chunks);
}

/** The caller's account data as the prompt numbers it: A1, A2, … */
export function accountSources(chunks: readonly KnowledgeChunk[]): PromptSource[] {
  return numbered(ACCOUNT_SOURCE_ID_PREFIX, chunks);
}
