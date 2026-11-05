import { ListingStatus, ListingVisibility, ProductStatus } from '@crossmart/database';
import { goingLiveWhere, isShownOnChannel, wouldGoLive } from './listing-visibility.js';

const ACTIVE = { status: ProductStatus.ACTIVE };
const DRAFT = { status: ProductStatus.DRAFT };
const listing = (status: ListingStatus, visibility?: ListingVisibility) => ({
  status,
  override: visibility ? { visibility } : null,
});

describe('isShownOnChannel', () => {
  it('follows the product status unless the merchant overrides it', () => {
    expect(isShownOnChannel(ACTIVE, null)).toBe(true);
    expect(isShownOnChannel(DRAFT, null)).toBe(false);
    expect(isShownOnChannel(DRAFT, listing(ListingStatus.PENDING, ListingVisibility.VISIBLE))).toBe(
      true,
    );
    expect(isShownOnChannel(ACTIVE, listing(ListingStatus.PENDING, ListingVisibility.HIDDEN))).toBe(
      false,
    );
  });
});

describe('wouldGoLive', () => {
  it('is true only for a shown listing that is not live yet', () => {
    expect(wouldGoLive(ACTIVE, listing(ListingStatus.PENDING))).toBe(true);
    expect(wouldGoLive(ACTIVE, listing(ListingStatus.INACTIVE))).toBe(true);
    expect(wouldGoLive(ACTIVE, listing(ListingStatus.ERROR))).toBe(true);
    expect(wouldGoLive(ACTIVE, listing(ListingStatus.ACTIVE))).toBe(false);
    expect(wouldGoLive(DRAFT, listing(ListingStatus.PENDING))).toBe(false);
  });
});

describe('goingLiveWhere', () => {
  it('narrows the products to those shown and not live on the connection', () => {
    const where = goingLiveWhere('conn-1', { workspaceId: 'ws-1' });
    expect(where).toEqual({
      AND: [
        { workspaceId: 'ws-1' },
        { NOT: { listings: { some: { connectionId: 'conn-1', status: ListingStatus.ACTIVE } } } },
        {
          OR: [
            {
              listings: {
                some: {
                  connectionId: 'conn-1',
                  override: { visibility: ListingVisibility.VISIBLE },
                },
              },
            },
            {
              status: ProductStatus.ACTIVE,
              NOT: {
                listings: {
                  some: {
                    connectionId: 'conn-1',
                    override: { visibility: ListingVisibility.HIDDEN },
                  },
                },
              },
            },
          ],
        },
      ],
    });
  });
});
