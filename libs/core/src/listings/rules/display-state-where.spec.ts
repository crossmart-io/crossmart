import { PublishRequirement, type UnmetPublishRequirement } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { channelProductStateOf } from './channel-product-state-where.js';
import { displayStateSources } from './display-state-where.js';
import { listingDisplayOf } from './listing-display-state.js';

const BLOCKER: UnmetPublishRequirement = {
  requirement: PublishRequirement.Reconnect,
  reason: 'Connect the store again',
};
const BLOCKER_SETS: UnmetPublishRequirement[][] = [[], [BLOCKER]];
const QUEUED_AT = new Date('2026-11-06T10:00:00Z');

/** Every combination of what a display state reads. */
function inputs() {
  const statuses = [null, ...Object.values(ListingStatus)];
  return [true, false].flatMap((selected) =>
    [true, false].flatMap((removedByHand) =>
      BLOCKER_SETS.flatMap((blockers) =>
        [null, QUEUED_AT].flatMap((syncRequestedAt) =>
          statuses.map((status) => ({
            selected,
            removedByHand,
            blockers,
            listing: status
              ? { status, lastError: null, missingRequirement: null, syncRequestedAt }
              : null,
          })),
        ),
      ),
    ),
  );
}

describe('displayStateSources', () => {
  it('names every product state a display state can come from', () => {
    for (const input of inputs()) {
      const display = listingDisplayOf(input);
      const listings = input.listing ? [input.listing] : [];
      const state = channelProductStateOf(input.selected, listings, input.removedByHand);

      expect(displayStateSources(display.state)).toContain(state);
    }
  });

  it('keeps products removed by hand out of drafts', () => {
    expect(displayStateSources(ListingDisplayState.Draft)).toEqual([ChannelProductState.Excluded]);
  });
});
