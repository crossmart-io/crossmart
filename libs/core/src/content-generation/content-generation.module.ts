import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { AiModule } from '../ai/ai.module.js';
import { ChannelsModule } from '../channels/channels.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { SuggestionsModule } from '../suggestions/suggestions.module.js';
import { BullContentGenerationQueue } from './queue/bull-content-generation.queue.js';
import { ContentGenerationQueue } from './queue/content-generation.queue.js';
import { ContentProductRepository } from './repositories/content-product.repository.js';
import { ContentGenerationRunner } from './services/content-generation.runner.js';
import { ContentGenerationService } from './services/content-generation.service.js';
import { ContentRequestValidator } from './services/content-request.validator.js';
import { ContentTargetLoader } from './services/content-target.loader.js';
import { ContentGenerator } from './services/content.generator.js';

/**
 * The Content Generator, the first AI agent: the API queues requests
 * (`ContentGenerationService`) and the worker runs them (`ContentGenerationRunner`) from the
 * `ai` queue, turning each answer into pending suggestions. Needs the global `QueuesModule`.
 */
@Module({
  imports: [ActivityModule, AiModule, ChannelsModule, ListingsModule, SuggestionsModule],
  providers: [
    ContentProductRepository,
    ContentRequestValidator,
    ContentTargetLoader,
    ContentGenerator,
    ContentGenerationRunner,
    ContentGenerationService,
    { provide: ContentGenerationQueue, useClass: BullContentGenerationQueue },
  ],
  exports: [ContentGenerationService, ContentGenerationRunner, ContentGenerationQueue],
})
export class ContentGenerationModule {}
