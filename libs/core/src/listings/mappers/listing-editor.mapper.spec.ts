import { ChannelType } from '@crossmart/connectors';
import { ChannelConnectionStatus, ListingVisibility, ProductStatus } from '@crossmart/database';
import type { ListingOverrideView } from '../entities/listing-override.js';
import type { ProductChannelView } from '../entities/listing-views.js';
import type { ResolvedPrice } from '../entities/price-resolution.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { PriceSource } from '../enums/price-source.enum.js';
import {
  CONNECTION_ID,
  listingRecord,
  productDetail,
  VARIANT_ID,
} from '../testing/listing.fixtures.js';
import { inheritedField, toListingEditorView } from './listing-editor.mapper.js';

const RULE_PRICE: ResolvedPrice = {
  price: '102.99',
  compareAtPrice: null,
  source: PriceSource.Rule,
  steps: [],
  explanation: '$89.00 → +15% → .99 = $102.99',
  warnings: [],
  unitCost: null,
};

const NO_OVERRIDES: ListingOverrideView = {
  title: null,
  descriptionHtml: null,
  vendor: null,
  tags: null,
  mediaUrls: null,
  visibility: null,
  inventoryBuffer: null,
  maxQuantity: null,
  variantPrices: [],
  updatedAt: new Date('2026-11-05T10:00:00Z'),
};

function channelView(
  override: ListingOverrideView | null,
  price: ResolvedPrice = RULE_PRICE,
): ProductChannelView {
  return {
    connection: {
      id: CONNECTION_ID,
      channel: ChannelType.Ebay,
      displayName: 'eBay',
      status: ChannelConnectionStatus.CONNECTED,
      currencyCode: 'USD',
    },
    selected: true,
    displayState: ListingDisplayState.Ready,
    displayReason: null,
    displayRequirement: null,
    listing: null,
    override,
    variants: [
      { variantId: VARIANT_ID, title: 'Blue', price, rulePrice: RULE_PRICE.price, quantity: 12 },
    ],
  };
}

describe('inheritedField', () => {
  it('follows the product without an override, and takes the override when set', () => {
    expect(inheritedField('Mug', null)).toEqual({
      product: 'Mug',
      override: null,
      effective: 'Mug',
      overridden: false,
    });
    expect(inheritedField('Mug', 'Store mug')).toMatchObject({
      effective: 'Store mug',
      overridden: true,
    });
  });
});

describe('toListingEditorView', () => {
  it('shows every field following the product when the listing has no overrides', () => {
    const product = productDetail();

    const view = toListingEditorView({
      channel: channelView(null),
      product,
      listing: null,
      hasTaxonomy: false,
    });

    expect(view.title).toEqual(inheritedField(product.title, null));
    expect(view.tags.effective).toEqual(product.tags);
    expect(view.images.effective).toEqual(product.media.map((media) => media.url));
    expect(view.visibility).toMatchObject({
      product: ListingVisibility.VISIBLE,
      effective: ListingVisibility.VISIBLE,
      overridden: false,
    });
    expect(view.stock).toEqual({ inventoryBuffer: null, maxQuantity: null });
    expect(view.overrideUpdatedAt).toBeNull();
    expect(view.category).toEqual({ supported: false, value: null });
    expect(view.itemSpecifics).toEqual({ supported: false, count: 0, names: [] });
  });

  it('splits each overridden field into the product’s value, the override and the result', () => {
    const override: ListingOverrideView = {
      ...NO_OVERRIDES,
      title: 'Store mug',
      mediaUrls: ['https://cdn.example.com/2.jpg'],
      visibility: ListingVisibility.VISIBLE,
      maxQuantity: 5,
    };

    const view = toListingEditorView({
      channel: channelView(override),
      product: productDetail({ status: ProductStatus.DRAFT }),
      listing: null,
      hasTaxonomy: false,
    });

    expect(view.title).toEqual({
      product: 'Mug',
      override: 'Store mug',
      effective: 'Store mug',
      overridden: true,
    });
    expect(view.images).toEqual({
      product: ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'],
      override: ['https://cdn.example.com/2.jpg'],
      effective: ['https://cdn.example.com/2.jpg'],
      overridden: true,
    });
    expect(view.visibility).toMatchObject({
      product: ListingVisibility.HIDDEN,
      effective: ListingVisibility.VISIBLE,
    });
    expect(view.stock.maxQuantity).toBe(5);
    expect(view.overrideUpdatedAt).toEqual(NO_OVERRIDES.updatedAt);
  });

  it('shows the catalog price, the fixed one and what the store gets for each variant', () => {
    const fixed: ResolvedPrice = {
      ...RULE_PRICE,
      price: '79.00',
      compareAtPrice: '99.00',
      source: PriceSource.Override,
    };
    const override: ListingOverrideView = {
      ...NO_OVERRIDES,
      variantPrices: [{ variantId: VARIANT_ID, price: '79.00', compareAtPrice: '99.00' }],
    };

    const [variant] = toListingEditorView({
      channel: channelView(override, fixed),
      product: productDetail(),
      listing: null,
      hasTaxonomy: false,
    }).variants;

    expect(variant?.price).toEqual({
      product: '89.00',
      override: '79.00',
      effective: '79.00',
      overridden: true,
    });
    expect(variant?.compareAtPrice).toEqual({
      product: null,
      override: '99.00',
      effective: '99.00',
      overridden: true,
    });
    expect(variant?.rulePrice).toBe('102.99');
    expect(variant?.resolvedPrice).toBe(fixed);
    expect(variant?.quantity).toBe(12);
  });

  it('takes the pricing rule’s price as the effective one when the price is not fixed', () => {
    const [variant] = toListingEditorView({
      channel: channelView(null),
      product: productDetail(),
      listing: null,
      hasTaxonomy: false,
    }).variants;

    expect(variant?.price).toEqual({
      product: '89.00',
      override: null,
      effective: '102.99',
      overridden: false,
    });
  });

  it('inherits the product’s vendor, which the store may replace or leave absent', () => {
    const source = { listing: null, hasTaxonomy: false };

    const inherited = toListingEditorView({
      ...source,
      channel: channelView(null),
      product: productDetail({ vendor: null }),
    });
    const replaced = toListingEditorView({
      ...source,
      channel: channelView({ ...NO_OVERRIDES, vendor: 'Store brand' }),
      product: productDetail(),
    });

    expect(inherited.vendor).toEqual(inheritedField(null, null));
    expect(replaced.vendor).toEqual({
      product: 'Acme',
      override: 'Store brand',
      effective: 'Store brand',
      overridden: true,
    });
  });

  it('summarizes the category and item specifics on channels that have them', () => {
    const listing = listingRecord({
      itemSpecifics: [
        { name: 'Brand', values: ['Acme'] },
        { name: 'Color', values: ['Blue'] },
      ],
    });
    const channel = channelView(null);
    channel.listing = {
      id: listing.id,
      status: listing.status,
      source: listing.source,
      externalId: null,
      externalUrl: null,
      lastError: null,
      missingRequirement: null,
      lastSyncedAt: null,
      syncRequestedAt: null,
      category: { id: '20625', name: 'Mugs' },
    };

    const view = toListingEditorView({
      channel,
      product: productDetail(),
      listing,
      hasTaxonomy: true,
    });

    expect(view.category).toEqual({ supported: true, value: { id: '20625', name: 'Mugs' } });
    expect(view.itemSpecifics).toEqual({ supported: true, count: 2, names: ['Brand', 'Color'] });
  });
});
