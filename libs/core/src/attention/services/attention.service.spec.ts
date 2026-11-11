import { ChannelType, PublishRequirement } from '@crossmart/connectors';
import { ChannelConnectionStatus, SuggestionStatus } from '@crossmart/database';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import type { AgentProposalRepository } from '../../agent-proposals/repositories/agent-proposal.repository.js';
import { proposalRecord } from '../../agent-proposals/testing/agent-proposal.fixtures.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import { connectionView, WORKSPACE_ID } from '../../listings/testing/listing.fixtures.js';
import { toSuggestionView } from '../../suggestions/mappers/suggestion.mapper.js';
import type { SuggestionsService } from '../../suggestions/services/suggestions.service.js';
import { suggestionRecord } from '../../suggestions/testing/suggestion.fixtures.js';
import { AttentionSection } from '../enums/attention-section.enum.js';
import { AttentionStoreReason } from '../enums/attention-store-reason.enum.js';
import type { FailedListingGroupRecord } from '../repositories/attention.queries.js';
import type { AttentionRepository } from '../repositories/attention.repository.js';
import { AttentionService } from './attention.service.js';
import { ListingAttentionReader } from './listing-attention.reader.js';
import { ReviewAttentionReader } from './review-attention.reader.js';
import { StoreAttentionReader } from './store-attention.reader.js';

const AT = new Date('2026-11-10T09:00:00Z');
const ALL_SECTIONS = new Set(Object.values(AttentionSection));
const STORES = [
  connectionView({ id: 'c-ok' }),
  connectionView({
    id: 'c-reauth',
    status: ChannelConnectionStatus.NEEDS_REAUTH,
    statusReason: 'Connect again',
  }),
  connectionView({ id: 'c-gone', status: ChannelConnectionStatus.DISCONNECTED }),
  connectionView({ id: 'c-empty', status: ChannelConnectionStatus.DISCONNECTED }),
];
const FAILED_GROUP: FailedListingGroupRecord = {
  productId: 'p-1',
  connectionId: 'c-ok',
  failedListings: 2,
  latest: {
    productId: 'p-1',
    connectionId: 'c-ok',
    lastError: 'Add Brand',
    missingRequirement: PublishRequirement.ItemSpecifics,
    updatedAt: AT,
    product: { title: 'Denim jacket', media: [{ url: 'https://cdn.example.com/j.jpg' }] },
    connection: { channel: ChannelType.Ebay, displayName: 'eBay US' },
  },
};

function setup() {
  const connections = {
    list: vi.fn<ChannelConnectionsService['list']>().mockResolvedValue(STORES),
  };
  const channelListings = {
    failedCounts: vi.fn<ChannelListingsService['failedCounts']>().mockResolvedValue(
      new Map([
        ['c-ok', 2],
        ['c-reauth', 1],
      ]),
    ),
  };
  const attention = {
    countLiveListings: vi.fn<AttentionRepository['countLiveListings']>().mockResolvedValue(
      new Map([
        ['c-gone', 4],
        ['c-ok', 9],
      ]),
    ),
    listFailedGroups: vi
      .fn<AttentionRepository['listFailedGroups']>()
      .mockResolvedValue([FAILED_GROUP]),
  };
  const pending = proposalRecord({ agentName: 'Claude' });
  const proposals = {
    list: vi
      .fn<AgentProposalRepository['list']>()
      .mockResolvedValue({ records: [pending], total: 3 }),
  };
  const suggestion = toSuggestionView(suggestionRecord());
  const suggestions = {
    list: vi.fn<SuggestionsService['list']>().mockResolvedValue({
      items: suggestion ? [suggestion] : [],
      nextCursor: null,
      total: 7,
    }),
  };
  const repository = attention as unknown as AttentionRepository;
  const service = new AttentionService(
    new StoreAttentionReader(connections as unknown as ChannelConnectionsService, repository),
    new ListingAttentionReader(channelListings as unknown as ChannelListingsService, repository),
    new ReviewAttentionReader(
      proposals as unknown as AgentProposalRepository,
      suggestions as unknown as SuggestionsService,
    ),
  );
  return { service, connections, attention, proposals, suggestions, pending };
}

/** The service with its real section readers over test doubles of what they read. */
describe('AttentionService', () => {
  it('counts each section like its own page, and totals them for the badge', async () => {
    const { service } = setup();

    const summary = await service.summary(WORKSPACE_ID, { sections: ALL_SECTIONS, limit: 5 });

    expect(summary.total).toBe(2 + 3 + 3 + 7);
    expect(summary.stores?.items.map((store) => [store.connectionId, store.reason])).toEqual([
      ['c-reauth', AttentionStoreReason.NeedsReauth],
      ['c-gone', AttentionStoreReason.DisconnectedWithListings],
    ]);
    expect(summary.stores?.items[1]?.liveListings).toBe(4);
    expect(summary.listings).toEqual({
      count: 3,
      items: [
        {
          productId: 'p-1',
          productTitle: 'Denim jacket',
          imageUrl: 'https://cdn.example.com/j.jpg',
          connectionId: 'c-ok',
          channel: ChannelType.Ebay,
          storeName: 'eBay US',
          failedListings: 2,
          lastError: 'Add Brand',
          missingRequirement: PublishRequirement.ItemSpecifics,
          updatedAt: AT,
        },
      ],
    });
    expect(summary.proposals?.count).toBe(3);
    expect(summary.proposals?.items[0]).toMatchObject({ agentName: 'Claude' });
    expect(summary.suggestions?.count).toBe(7);
    expect(summary.suggestions?.items[0]).toMatchObject({
      productTitle: 'Mug',
      storeName: 'eBay US',
    });
  });

  it('asks for pending proposals and suggestions only, up to the limit', async () => {
    const { service, proposals, suggestions, attention } = setup();

    await service.summary(WORKSPACE_ID, { sections: ALL_SECTIONS, limit: 2 });

    expect(proposals.list).toHaveBeenCalledWith(
      WORKSPACE_ID,
      { status: AgentProposalStatus.Pending, page: 1, limit: 2 },
      expect.any(Date),
    );
    expect(suggestions.list).toHaveBeenCalledWith(WORKSPACE_ID, {
      status: SuggestionStatus.PENDING,
      limit: 2,
    });
    expect(attention.listFailedGroups).toHaveBeenCalledWith(WORKSPACE_ID, 2);
  });

  it('lists at most `limit` stores but counts them all', async () => {
    const { service } = setup();

    const summary = await service.summary(WORKSPACE_ID, { sections: ALL_SECTIONS, limit: 1 });

    expect(summary.stores).toMatchObject({ count: 2, items: [{ connectionId: 'c-reauth' }] });
  });

  it('leaves out the sections the reader may not see, without reading them', async () => {
    const { service, connections, proposals, suggestions } = setup();

    const summary = await service.summary(WORKSPACE_ID, {
      sections: new Set([AttentionSection.Proposals]),
      limit: 5,
    });

    expect(summary).toMatchObject({ total: 3, stores: null, listings: null, suggestions: null });
    expect(connections.list).not.toHaveBeenCalled();
    expect(suggestions.list).not.toHaveBeenCalled();
    expect(proposals.list).toHaveBeenCalledTimes(1);
  });
});
