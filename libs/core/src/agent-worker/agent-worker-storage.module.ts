import { Module } from '@nestjs/common';
import { AgentWorkerConversationRepository } from './repositories/agent-worker-conversation.repository.js';
import { AgentWorkerRetentionService } from './services/agent-worker-retention.service.js';
import { AgentWorkerTokenService } from './services/agent-worker-token.service.js';

/**
 * Where Agent Worker's conversations are stored, their retention, and Agent Worker's API
 * credential. Apart from `AgentWorkerModule` so the worker can purge old conversations, and the
 * API's authentication can verify the credential, without loading the agent loop.
 */
@Module({
  providers: [
    AgentWorkerConversationRepository,
    AgentWorkerRetentionService,
    AgentWorkerTokenService,
  ],
  exports: [
    AgentWorkerConversationRepository,
    AgentWorkerRetentionService,
    AgentWorkerTokenService,
  ],
})
export class AgentWorkerStorageModule {}
