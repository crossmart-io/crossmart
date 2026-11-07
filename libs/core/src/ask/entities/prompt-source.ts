import type { KnowledgeChunk } from './knowledge-chunk.js';

/** A source as the prompt numbers it: docs are S1, S2, …; the caller's account data A1, A2, … */
export interface PromptSource {
  id: string;
  chunk: KnowledgeChunk;
}
