import { NotFoundException } from '@nestjs/common';
import { SuggestionCreatorType, SuggestionStatus } from '@crossmart/database';
import { ChannelType } from '@crossmart/connectors';
import { SuggestionAgent } from '../enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import {
  CONNECTION_ID,
  SUGGESTION_ID,
  suggestionRecord,
  WORKSPACE_ID,
} from '../testing/suggestion.fixtures.js';
import { SuggestionsService } from './suggestions.service.js';

const REF = { workspaceId: WORKSPACE_ID, suggestionId: SUGGESTION_ID };

function setup() {
  const repository = {
    find: vi.fn<SuggestionRepository['find']>().mockResolvedValue(suggestionRecord()),
    listPage: vi.fn<SuggestionRepository['listPage']>(),
  };
  return {
    repository,
    service: new SuggestionsService(repository as unknown as SuggestionRepository),
  };
}

describe('SuggestionsService', () => {
  it('shows a suggestion with its product, store and who asked for it', async () => {
    const { service } = setup();

    expect(await service.get(REF)).toMatchObject({
      id: SUGGESTION_ID,
      productTitle: 'Mug',
      imageUrl: 'https://cdn.example.com/1.jpg',
      connection: { id: CONNECTION_ID, channel: ChannelType.Ebay, displayName: 'eBay US' },
      kind: SuggestionKind.ListingTitle,
      status: SuggestionStatus.PENDING,
      createdBy: {
        type: SuggestionCreatorType.AGENT,
        agent: SuggestionAgent.ContentGenerator,
        name: 'Dana Levin',
      },
      review: null,
    });
  });

  it('is not found outside the workspace, or for a kind this version does not know', async () => {
    const { service, repository } = setup();
    repository.find.mockResolvedValueOnce(null);
    await expect(service.get(REF)).rejects.toThrow(NotFoundException);

    repository.find.mockResolvedValueOnce(suggestionRecord({ kind: 'from_the_future' }));
    await expect(service.get(REF)).rejects.toThrow(NotFoundException);
  });

  it('pages the inbox with a cursor and the total', async () => {
    const { service, repository } = setup();
    const second = suggestionRecord({ id: 'second' });
    repository.listPage.mockResolvedValue({
      records: [suggestionRecord(), second, suggestionRecord({ id: 'third' })],
      total: 7,
    });

    const page = await service.list(WORKSPACE_ID, { status: SuggestionStatus.PENDING, limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual([SUGGESTION_ID, 'second']);
    expect(page.nextCursor).toBe('second');
    expect(page.total).toBe(7);
  });
});
