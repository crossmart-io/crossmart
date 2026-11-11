import { Module } from '@nestjs/common';
import { AgentProposalsStorageModule } from '../agent-proposals/agent-proposals-storage.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { SuggestionsModule } from '../suggestions/suggestions.module.js';
import { AttentionRepository } from './repositories/attention.repository.js';
import { AttentionService } from './services/attention.service.js';
import { ListingAttentionReader } from './services/listing-attention.reader.js';
import { ReviewAttentionReader } from './services/review-attention.reader.js';
import { StoreAttentionReader } from './services/store-attention.reader.js';

/** What needs the merchant now: the one source for Home and the sidebar badge. */
@Module({
  imports: [AgentProposalsStorageModule, ChannelsModule, ListingsModule, SuggestionsModule],
  providers: [
    AttentionRepository,
    StoreAttentionReader,
    ListingAttentionReader,
    ReviewAttentionReader,
    AttentionService,
  ],
  exports: [AttentionService],
})
export class AttentionModule {}
