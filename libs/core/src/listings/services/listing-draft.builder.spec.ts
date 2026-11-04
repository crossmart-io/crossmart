import { ChannelType } from '@crossmart/connectors';
import { ListingVisibility, ProductStatus } from '@crossmart/database';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import { mediaDigest } from '../rules/media-digest.js';
import {
  listingRecord,
  overrideRecord,
  productDetail,
  publishedListing,
  variantPriceOverride,
  variantView,
} from '../testing/listing.fixtures.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import { ListingDraftBuilder } from './listing-draft.builder.js';

const builder = new ListingDraftBuilder(new ChannelPriceResolver());
const USD = { rule: null, currencyCode: 'USD' };
const MARKUP = {
  rule: {
    adjustmentPercent: '15',
    fixedAmount: '0',
    rounding: PriceRounding.Ending99,
    floor: null,
    compareAt: CompareAtMode.Adjust,
  },
  currencyCode: 'USD',
};

describe('ListingDraftBuilder', () => {
  it('carries the account settings and the listing’s channel category', () => {
    const account = { channel: ChannelType.Ebay };
    const listing = listingRecord({ channelCategoryId: '20625', channelCategoryName: 'Mugs' });

    const { draft } = builder.build({ product: productDetail(), listing, pricing: USD, account });

    expect(draft.accountSettings).toBe(account);
    expect(draft.category).toEqual({ id: '20625', name: 'Mugs' });
    expect(
      builder.build({ product: productDetail(), listing: null, pricing: USD }).draft,
    ).toMatchObject({
      accountSettings: null,
      category: null,
    });
  });

  it('sends the product as it is in the catalog when the listing has no overrides', () => {
    const { draft, mediaDigest: digest } = builder.build({
      product: productDetail(),
      listing: null,
      pricing: USD,
    });

    expect(draft.product).toMatchObject({
      handle: 'mug',
      title: 'Mug',
      tags: ['kitchen'],
      active: true,
      images: [
        { url: 'https://cdn.example.com/1.jpg', altText: 'Front' },
        { url: 'https://cdn.example.com/2.jpg', altText: null },
      ],
    });
    expect(draft.variants[0]).toMatchObject({
      price: '89.00',
      unitCost: '40.00',
      available: 12,
      externalVariantId: null,
    });
    expect(draft.imagesChanged).toBe(true);
    expect(digest).toBe(mediaDigest(draft.product.images));
  });

  it('applies content, image, visibility and stock overrides', () => {
    const listing = listingRecord({
      override: overrideRecord({
        title: 'Mug for Shopify',
        tagsOverridden: true,
        tags: [],
        mediaOverridden: true,
        mediaUrls: ['https://cdn.example.com/2.jpg', 'https://gone.example.com/x.jpg'],
        visibility: ListingVisibility.HIDDEN,
        inventoryBuffer: 2,
        maxQuantity: 8,
      }),
    });

    const { draft } = builder.build({ product: productDetail(), listing, pricing: USD });

    expect(draft.product).toMatchObject({ title: 'Mug for Shopify', tags: [], active: false });
    expect(draft.product.images.map((image) => image.url)).toEqual([
      'https://cdn.example.com/2.jpg',
    ]);
    expect(draft.variants[0]?.available).toBe(8);
  });

  it('shows a draft product when the merchant makes it visible on the channel', () => {
    const listing = listingRecord({
      override: overrideRecord({ visibility: ListingVisibility.VISIBLE }),
    });

    const { draft } = builder.build({
      product: productDetail({ status: ProductStatus.DRAFT }),
      listing,
      pricing: USD,
    });

    expect(draft.product.active).toBe(true);
  });

  it('prices with the manual price first, else the rule, and keeps the channel ids', () => {
    const product = productDetail({
      variants: [variantView(), variantView({ id: 'other', price: '10.00' })],
    });
    const listing = publishedListing({ variantOverrides: [variantPriceOverride('79.00')] });

    const { draft } = builder.build({ product, listing, pricing: MARKUP });

    expect(draft.variants.map((variant) => [variant.price, variant.externalVariantId])).toEqual([
      ['79.00', 'gid://shopify/ProductVariant/1'],
      ['11.99', null],
    ]);
  });

  it('does not resend unchanged images, and sends no stock for untracked variants', () => {
    const product = productDetail({ variants: [variantView({ tracked: false })] });
    const first = builder.build({ product, listing: null, pricing: USD });
    const listing = publishedListing({ mediaDigest: first.mediaDigest });

    const { draft } = builder.build({ product, listing, pricing: USD });

    expect(draft.imagesChanged).toBe(false);
    expect(draft.variants[0]).toMatchObject({ tracked: false, available: null });
  });

  it('lists the price updates of the variants the channel holds', () => {
    const product = productDetail({
      variants: [variantView(), variantView({ id: 'unpublished' })],
    });
    const listing = publishedListing();

    const updates = builder.priceUpdates(
      product,
      { ...listing, externalId: 'gid://shopify/Product/1' },
      MARKUP,
    );

    expect(updates).toEqual([
      {
        externalProductId: 'gid://shopify/Product/1',
        externalVariantId: 'gid://shopify/ProductVariant/1',
        price: '102.99',
        compareAtPrice: null,
      },
    ]);
  });
});
