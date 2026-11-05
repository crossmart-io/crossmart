import { Injectable } from '@nestjs/common';
import type { NewSuggestion } from '../entities/suggestion.js';
import { SuggestionRepository } from '../repositories/suggestion.repository.js';

/**
 * Stores what agents propose. A proposal equal to the current value is no change and is
 * dropped; a new proposal replaces an older pending one for the same field.
 */
@Injectable()
export class SuggestionWriter {
  constructor(private readonly suggestions: SuggestionRepository) {}

  /** Returns how many suggestions were stored. */
  async propose(suggestions: readonly NewSuggestion[]): Promise<number> {
    const changes = suggestions.filter(
      (suggestion) => suggestion.proposedValue !== suggestion.currentValue,
    );
    await this.suggestions.replacePending(changes);
    return changes.length;
  }
}
