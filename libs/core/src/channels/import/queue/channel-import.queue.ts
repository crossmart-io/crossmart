import type { ChannelImportJobRef } from '../entities/channel-import.js';

/**
 * Hands an import to the background worker. The API depends on this abstraction, so tests
 * can run imports inline instead of through Redis.
 */
export abstract class ChannelImportQueue {
  abstract enqueue(job: ChannelImportJobRef): Promise<void>;
}
