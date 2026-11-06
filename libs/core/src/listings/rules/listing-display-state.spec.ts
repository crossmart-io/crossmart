import { PublishRequirement, type UnmetPublishRequirement } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import type { DisplayedListing, ListingDisplayInput } from '../entities/listing-display.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { listingDisplayOf } from './listing-display-state.js';

const NO_POLICY: UnmetPublishRequirement = {
  requirement: PublishRequirement.ShippingPolicy,
  reason: 'Choose a shipping policy',
};
const NO_IMAGES: UnmetPublishRequirement = {
  requirement: PublishRequirement.Images,
  reason: 'Add an image',
};

function listing(status: ListingStatus, overrides: Partial<DisplayedListing> = {}) {
  return { status, lastError: null, missingRequirement: null, ...overrides };
}

function input(overrides: Partial<ListingDisplayInput> = {}): ListingDisplayInput {
  return { selected: true, removedByHand: false, listing: null, blockers: [], ...overrides };
}

describe('listingDisplayOf', () => {
  describe('a product the store does not select', () => {
    it('is a draft when it was never on the channel', () => {
      expect(listingDisplayOf(input({ selected: false }))).toEqual({
        state: ListingDisplayState.Draft,
        reason: null,
      });
    });

    it('is a draft when a pending listing was never sent', () => {
      const pending = input({ selected: false, listing: listing(ListingStatus.PENDING) });

      expect(listingDisplayOf(pending).state).toBe(ListingDisplayState.Draft);
    });

    it('is removed once delisted, or when removed by hand', () => {
      const delisted = input({ selected: false, listing: listing(ListingStatus.DELISTED) });
      const byHand = input({ selected: false, removedByHand: true });

      expect(listingDisplayOf(delisted).state).toBe(ListingDisplayState.Removed);
      expect(listingDisplayOf(byHand).state).toBe(ListingDisplayState.Removed);
    });

    it.each([ListingStatus.ACTIVE, ListingStatus.INACTIVE])(
      'is removing while the channel still holds it (%s)',
      (status) => {
        const held = input({ selected: false, listing: listing(status) });

        expect(listingDisplayOf(held).state).toBe(ListingDisplayState.Removing);
      },
    );

    it('failed when taking it off the channel failed, whatever blocks publishing', () => {
      const failed = input({
        selected: false,
        listing: listing(ListingStatus.ERROR, { lastError: 'eBay is down' }),
        blockers: [NO_POLICY],
      });

      expect(listingDisplayOf(failed)).toEqual({
        state: ListingDisplayState.Failed,
        reason: 'eBay is down',
      });
    });
  });

  describe('a selected product off the channel', () => {
    it('is ready when nothing blocks it and nothing is queued', () => {
      expect(listingDisplayOf(input())).toEqual({ state: ListingDisplayState.Ready, reason: null });
    });

    it('is ready again once delisted, until it is queued', () => {
      const delisted = input({ listing: listing(ListingStatus.DELISTED) });

      expect(listingDisplayOf(delisted).state).toBe(ListingDisplayState.Ready);
    });

    it('is publishing once queued', () => {
      const queued = input({ listing: listing(ListingStatus.PENDING) });

      expect(listingDisplayOf(queued).state).toBe(ListingDisplayState.Publishing);
    });

    it('needs details, with the first blocker’s reason, when something blocks it', () => {
      const blocked = input({
        listing: listing(ListingStatus.PENDING),
        blockers: [NO_POLICY, NO_IMAGES],
      });

      expect(listingDisplayOf(blocked)).toEqual({
        state: ListingDisplayState.NeedsDetails,
        reason: NO_POLICY.reason,
      });
    });
  });

  describe('a selected product the channel holds', () => {
    it.each([ListingStatus.ACTIVE, ListingStatus.INACTIVE])('is published (%s)', (status) => {
      const held = input({ listing: listing(status), blockers: [NO_POLICY] });

      expect(listingDisplayOf(held)).toEqual({
        state: ListingDisplayState.Published,
        reason: null,
      });
    });
  });

  describe('a selected product whose last sync was refused', () => {
    it('failed, with the channel’s message, when nothing names what it lacks', () => {
      const failed = input({ listing: listing(ListingStatus.ERROR, { lastError: 'Bad price' }) });

      expect(listingDisplayOf(failed)).toEqual({
        state: ListingDisplayState.Failed,
        reason: 'Bad price',
      });
    });

    it('needs details when the channel named what it lacks', () => {
      const refused = input({
        listing: listing(ListingStatus.ERROR, {
          lastError: 'eBay requires these item specifics: Brand',
          missingRequirement: PublishRequirement.ItemSpecifics,
        }),
      });

      expect(listingDisplayOf(refused)).toEqual({
        state: ListingDisplayState.NeedsDetails,
        reason: 'eBay requires these item specifics: Brand',
      });
    });

    it('needs details when publishing is blocked now', () => {
      const failed = input({
        listing: listing(ListingStatus.ERROR, { lastError: 'Bad price' }),
        blockers: [NO_IMAGES],
      });

      expect(listingDisplayOf(failed)).toEqual({
        state: ListingDisplayState.NeedsDetails,
        reason: NO_IMAGES.reason,
      });
    });
  });
});
