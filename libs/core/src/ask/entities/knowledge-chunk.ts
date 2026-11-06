import type { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';

/** One section of a public document: what Ask retrieves, sends to the model and cites. */
export interface KnowledgeChunk {
  /** Stable within a build: `<source>:<path>#<anchor>`, with a part number when split. */
  id: string;
  source: KnowledgeSourceKind;
  /** The page title and section, such as "Developer overview › Rate limits". */
  title: string;
  /** The public URL a citation links to, with the section anchor. */
  url: string;
  text: string;
}

/** A chunk found for a question, with its retrieval score. */
export interface RetrievedChunk {
  chunk: KnowledgeChunk;
  score: number;
}
