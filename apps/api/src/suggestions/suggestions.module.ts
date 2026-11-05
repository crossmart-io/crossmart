import { Module } from '@nestjs/common';
import { SuggestionsModule } from '@crossmart/core';
import { SuggestionsController } from './controllers/suggestions.controller.js';

@Module({
  imports: [SuggestionsModule],
  controllers: [SuggestionsController],
})
export class SuggestionsApiModule {}
