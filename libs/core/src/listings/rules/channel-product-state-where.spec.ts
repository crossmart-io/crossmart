import { ListingStatus } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import {
  channelProductStateOf,
  channelProductStateWhere,
  shownListing,
} from './channel-product-state-where.js';

const listing = (status: ListingStatus, id = status) => ({ id, status });
const SCOPE = { workspaceId: 'ws-1', connectionId: 'conn-1', rule: null };

describe('channelProductStateOf', () => {
  it.each([
    [true, [], ChannelProductState.Pending],
    [true, [listing(ListingStatus.PENDING)], ChannelProductState.Pending],
    [true, [listing(ListingStatus.ACTIVE)], ChannelProductState.Listed],
    [true, [listing(ListingStatus.INACTIVE)], ChannelProductState.Listed],
    [true, [listing(ListingStatus.DELISTED)], ChannelProductState.Pending],
    [false, [listing(ListingStatus.ACTIVE)], ChannelProductState.Removing],
    [false, [listing(ListingStatus.DELISTED)], ChannelProductState.Excluded],
    [false, [], ChannelProductState.Excluded],
    [false, [listing(ListingStatus.ERROR)], ChannelProductState.Failed],
    [
      true,
      [listing(ListingStatus.ACTIVE), listing(ListingStatus.ERROR)],
      ChannelProductState.Failed,
    ],
  ])('selected %s with %j is %s', (selected, listings, expected) => {
    expect(channelProductStateOf(selected, listings)).toBe(expected);
  });
});

describe('shownListing', () => {
  it('shows a failed listing first, then one on the channel, else the latest', () => {
    const delisted = listing(ListingStatus.DELISTED);
    const active = listing(ListingStatus.ACTIVE);
    const failed = listing(ListingStatus.ERROR);

    expect(shownListing([delisted, active, failed])).toBe(failed);
    expect(shownListing([delisted, active])).toBe(active);
    expect(shownListing([delisted])).toBe(delisted);
    expect(shownListing([])).toBeNull();
  });
});

describe('channelProductStateWhere', () => {
  it('keeps every state to the workspace and to the connection’s listings', () => {
    for (const state of Object.values(ChannelProductState)) {
      const where = JSON.stringify(channelProductStateWhere(SCOPE, state));
      expect(where).toContain('"workspaceId":"ws-1"');
      expect(where).toContain('"connectionId":"conn-1"');
    }
  });

  it('decides failed products by their listing alone, whatever the selection', () => {
    expect(channelProductStateWhere(SCOPE, ChannelProductState.Failed)).toEqual({
      workspaceId: 'ws-1',
      listings: { some: { connectionId: 'conn-1', status: { in: [ListingStatus.ERROR] } } },
    });
  });
});
