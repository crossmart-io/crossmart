import type { ContentGenerationJob } from '../entities/content-generation.js';

/**
 * Hands content generation to the worker. The API depends on this abstraction, so tests can
 * run jobs inline instead of through Redis.
 */
export abstract class ContentGenerationQueue {
  abstract enqueue(jobs: readonly ContentGenerationJob[]): Promise<void>;
}
