import { Injectable } from '@nestjs/common';
import { AgentWorkerRetentionService, AskRetentionService } from '@crossmart/core';

/** The retention of stored conversations: Ask Crossmart's and Crossmart Agent's. */
@Injectable()
export class ConversationRetention {
  constructor(
    private readonly ask: AskRetentionService,
    private readonly agentWorker: AgentWorkerRetentionService,
  ) {}

  /** Returns how many Ask Crossmart conversations were deleted. */
  purgeAsk(): Promise<number> {
    return this.ask.purge();
  }

  /** Returns how many Crossmart Agent conversations were deleted. */
  purgeAgentWorker(): Promise<number> {
    return this.agentWorker.purge();
  }
}
