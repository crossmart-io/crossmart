import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ChannelProductView } from '../enums/channel-product-view.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { CONNECTION_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import { channelProductStateWhere } from './channel-product-state-where.js';
import {
  channelProductViewMatch,
  channelProductViewWhere,
  displayStateMatch,
  inStoreWhere,
} from './channel-product-view.js';

const SCOPE = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, rule: null };

function display(state: ListingDisplayState) {
  return { state, reason: null, requirement: null };
}

function statesWhere(...states: ChannelProductState[]) {
  return { OR: states.map((state) => channelProductStateWhere(SCOPE, state)) };
}

describe('channelProductViewWhere', () => {
  it('lists the products in the store for the all view', () => {
    expect(channelProductViewWhere(SCOPE, ChannelProductView.All)).toEqual(inStoreWhere(SCOPE));
  });

  it('narrows each other view to the product states it is made of', () => {
    expect(channelProductViewWhere(SCOPE, ChannelProductView.Live)).toEqual(
      statesWhere(ChannelProductState.Listed),
    );
    expect(channelProductViewWhere(SCOPE, ChannelProductView.NeedsAttention)).toEqual(
      statesWhere(ChannelProductState.Failed, ChannelProductState.Pending),
    );
    expect(channelProductViewWhere(SCOPE, ChannelProductView.NotListed)).toEqual(
      statesWhere(
        ChannelProductState.Pending,
        ChannelProductState.Removing,
        ChannelProductState.RemovedByHand,
        ChannelProductState.Excluded,
      ),
    );
  });

  it('keeps every condition scoped to the workspace', () => {
    for (const view of Object.values(ChannelProductView)) {
      expect(JSON.stringify(channelProductViewWhere(SCOPE, view))).toContain(WORKSPACE_ID);
    }
  });
});

describe('channelProductViewMatch', () => {
  it('needs no display for the views SQL decides alone', () => {
    for (const view of [ChannelProductView.All, ChannelProductView.Live]) {
      expect(channelProductViewMatch(view)).toBeNull();
    }
    expect(channelProductViewMatch(ChannelProductView.NotListed)).toBeNull();
  });

  it('keeps failed products and those that need details for needs attention', () => {
    const matches = channelProductViewMatch(ChannelProductView.NeedsAttention);

    expect(matches?.(display(ListingDisplayState.NeedsDetails), false)).toBe(true);
    expect(matches?.(display(ListingDisplayState.Publishing), true)).toBe(true);
    expect(matches?.(display(ListingDisplayState.Ready), false)).toBe(false);
  });
});

describe('displayStateMatch', () => {
  it('keeps only the display state asked for', () => {
    const matches = displayStateMatch(ListingDisplayState.Ready);

    expect(matches(display(ListingDisplayState.Ready), false)).toBe(true);
    expect(matches(display(ListingDisplayState.Failed), true)).toBe(false);
  });
});
