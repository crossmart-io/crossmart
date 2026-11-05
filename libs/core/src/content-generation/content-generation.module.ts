import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { AiModule } from '../ai/ai.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { SuggestionsModule } from '../suggestions/suggestions.module.js';
import { BullContentGenerationQueue } from './queue/bull-content-generation.queue.js';
import { ContentGenerationQueue } from './queue/content-generation.queue.js';
import { ChannelContentRulesResolver } from './services/channel-content-rules.resolver.js';
import { ContentProductRepository } from './repositories/content-product.repository.js';
import { ContentDraftService } from './services/content-draft.service.js';
import { ContentDraftTargetLoader } from './services/content-draft-target.loader.js';
import { ContentGenerationRunner } from './services/content-generation.runner.js';
import { ContentGenerationService } from './services/content-generation.service.js';
import { ContentRequestValidator } from './services/content-request.validator.js';
import { ContentTargetLoader } from './services/content-target.loader.js';
import { ContentGenerator } from './services/content.generator.js';

/**
 * The Content Generator, the first AI agent: the API queues requests
 * (`ContentGenerationService`) and the worker runs them (`ContentGenerationRunner`) from the
 * `ai` queue, turning each answer into pending suggestions. `ContentDraftService` rewrites
 * fields a merchant is editing, right away and without storing anything. Needs the global `QueuesModule`.
 */
@Module({
  imports: [
    ActivityModule,
    AiModule,
    CatalogModule,
    ChannelsModule,
    ListingsModule,
    SuggestionsModule,
  ],
  providers: [
    ChannelContentRulesResolver,
    ContentProductRepository,
    ContentRequestValidator,
    ContentTargetLoader,
    ContentGenerator,
    ContentDraftTargetLoader,
    ContentDraftService,
    ContentGenerationRunner,
    ContentGenerationService,
    { provide: ContentGenerationQueue, useClass: BullContentGenerationQueue },
  ],
  exports: [
    ContentDraftService,
    ContentGenerationService,
    ContentGenerationRunner,
    ContentGenerationQueue,
  ],
})
export class ContentGenerationModule {}
