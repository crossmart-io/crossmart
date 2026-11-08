import { Injectable } from '@nestjs/common';
import { MS_PER_DAY } from '@crossmart/common';
import {
  AGENT_WORKER_RETENTION_BATCH_SIZE,
  AGENT_WORKER_RETENTION_DAYS,
  AGENT_WORKER_RETENTION_MAX_BATCHES,
} from '../agent-worker.constants.js';
import { AgentWorkerConversationRepository } from '../repositories/agent-worker-conversation.repository.js';

/**
 * Deletes Agent Worker conversations, with their messages and tool calls, once their last
 * message is older than `AGENT_WORKER_RETENTION_DAYS` (ADR 0026).
 */
@Injectable()
export class AgentWorkerRetentionService {
  constructor(private readonly conversations: AgentWorkerConversationRepository) {}

  /** Returns how many conversations were deleted. Works in batches, so no statement runs long. */
  async purge(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - AGENT_WORKER_RETENTION_DAYS * MS_PER_DAY);
    let deleted = 0;
    for (let batch = 0; batch < AGENT_WORKER_RETENTION_MAX_BATCHES; batch += 1) {
      const removed = await this.conversations.deleteIdleBefore(
        cutoff,
        AGENT_WORKER_RETENTION_BATCH_SIZE,
      );
      deleted += removed;
      if (removed < AGENT_WORKER_RETENTION_BATCH_SIZE) break;
    }
    return deleted;
  }
}
