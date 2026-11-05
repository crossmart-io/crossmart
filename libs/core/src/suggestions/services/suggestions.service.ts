import { Injectable, NotFoundException } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type {
  SuggestionPage,
  SuggestionQuery,
  SuggestionRef,
  SuggestionView,
} from '../entities/suggestion.js';
import { toSuggestionView } from '../mappers/suggestion.mapper.js';
import { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { SUGGESTION_NOT_FOUND } from '../suggestions.constants.js';

/** Reads a workspace's suggestions inbox, newest first. */
@Injectable()
export class SuggestionsService {
  constructor(private readonly suggestions: SuggestionRepository) {}

  async list(workspaceId: string, query: SuggestionQuery): Promise<SuggestionPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.suggestions.listPage(workspaceId, query),
      query.limit,
    );
    return {
      items: rows.flatMap((record) => toSuggestionView(record) ?? []),
      nextCursor,
      total,
    };
  }

  async get(ref: SuggestionRef): Promise<SuggestionView> {
    const record = await this.suggestions.find(ref);
    const view = record ? toSuggestionView(record) : null;
    if (!view) throw new NotFoundException(SUGGESTION_NOT_FOUND);
    return view;
  }
}
