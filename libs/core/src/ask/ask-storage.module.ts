import { Module } from '@nestjs/common';
import { AskConversationRepository } from './repositories/ask-conversation.repository.js';
import { AskRetentionService } from './services/ask-retention.service.js';

/**
 * Where Ask Crossmart's conversations are stored, and their retention (ADR 0025). Apart from
 * `AskModule` so the worker can purge old conversations without loading the AI and the lookups.
 */
@Module({
  providers: [AskConversationRepository, AskRetentionService],
  exports: [AskConversationRepository, AskRetentionService],
})
export class AskStorageModule {}
