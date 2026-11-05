import { SuggestionCreatorType } from '@crossmart/database';
import type { NewSuggestion } from '../entities/suggestion.js';
import { SuggestionAgent } from '../enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { CONNECTION_ID, PRODUCT_ID, WORKSPACE_ID } from '../testing/suggestion.fixtures.js';
import { SuggestionWriter } from './suggestion.writer.js';

function suggestion(
  kind: SuggestionKind,
  currentValue: string,
  proposedValue: string,
): NewSuggestion {
  return {
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    connectionId: CONNECTION_ID,
    kind,
    currentValue,
    proposedValue,
    rationale: 'Better',
    createdByType: SuggestionCreatorType.AGENT,
    agent: SuggestionAgent.ContentGenerator,
    requestedByUserId: 'user-1',
    requestedByApiKeyId: null,
  };
}

describe('SuggestionWriter', () => {
  it('stores real changes and drops proposals equal to the current value', async () => {
    const repository = {
      replacePending: vi.fn<SuggestionRepository['replacePending']>().mockResolvedValue(),
    };
    const writer = new SuggestionWriter(repository as unknown as SuggestionRepository);
    const title = suggestion(SuggestionKind.ListingTitle, 'Mug', 'Stoneware Mug');
    const sameDescription = suggestion(SuggestionKind.ListingDescription, '<p>A</p>', '<p>A</p>');

    expect(await writer.propose([title, sameDescription])).toBe(1);
    expect(repository.replacePending).toHaveBeenCalledWith([title]);
  });
});
