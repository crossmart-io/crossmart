import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { SuggestionRepository } from './repositories/suggestion.repository.js';
import { SuggestionApplier } from './services/suggestion.applier.js';
import { SuggestionReviewService } from './services/suggestion-review.service.js';
import { SuggestionWriter } from './services/suggestion.writer.js';
import { SuggestionsService } from './services/suggestions.service.js';

/**
 * The suggestions engine: agents (and later people and API clients) propose changes, and
 * someone who may approve them applies or rejects them from the inbox. Applying goes through
 * the same domain services a user's edit does.
 */
@Module({
  imports: [ActivityModule, ListingsModule],
  providers: [
    SuggestionRepository,
    SuggestionApplier,
    SuggestionWriter,
    SuggestionsService,
    SuggestionReviewService,
  ],
  exports: [SuggestionWriter, SuggestionsService, SuggestionReviewService],
})
export class SuggestionsModule {}
