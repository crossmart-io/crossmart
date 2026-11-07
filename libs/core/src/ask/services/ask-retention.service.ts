import { Injectable } from '@nestjs/common';
import { MS_PER_DAY } from '@crossmart/common';
import {
  ASK_RETENTION_BATCH_SIZE,
  ASK_RETENTION_DAYS,
  ASK_RETENTION_MAX_BATCHES,
} from '../ask.constants.js';
import { AskConversationRepository } from '../repositories/ask-conversation.repository.js';

/**
 * Deletes Ask Crossmart conversations, with their turns and escalations, once their last turn
 * is older than `ASK_RETENTION_DAYS` (ADR 0025).
 */
@Injectable()
export class AskRetentionService {
  constructor(private readonly conversations: AskConversationRepository) {}

  /** Returns how many conversations were deleted. Works in batches, so no statement runs long. */
  async purge(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - ASK_RETENTION_DAYS * MS_PER_DAY);
    let deleted = 0;
    for (let batch = 0; batch < ASK_RETENTION_MAX_BATCHES; batch += 1) {
      const removed = await this.conversations.deleteIdleBefore(cutoff, ASK_RETENTION_BATCH_SIZE);
      deleted += removed;
      if (removed < ASK_RETENTION_BATCH_SIZE) break;
    }
    return deleted;
  }
}
