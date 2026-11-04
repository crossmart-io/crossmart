import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { EBAY_MERCHANT_LOCATION_KEY } from '../ebay.constants.js';
import { EbayMarketplaceId } from '../ebay-marketplace.js';
import type { EbaySettings } from '../ebay-settings.js';
import { EbayCondition } from '../listing/ebay-condition.enum.js';

export const API = 'https://api.sandbox.ebay.com';
export const INVENTORY = `${API}/sell/inventory/v1`;
export const SHIRT_ID = '33333333-3333-4333-8333-333333333333';
export const SHIRT_GROUP = 'CM33333333333343338333333333333333';
export const VARIANT_S = '11111111-1111-4111-8111-111111111111';
export const VARIANT_M = '22222222-2222-4222-8222-222222222222';
export const MUG_ID = '44444444-4444-4444-8444-444444444444';
export const MUG_VARIANT = '55555555-5555-4555-8555-555555555555';
export const MUG_SKU = 'CM55555555555545558555555555555555';

export const offersUrl = (sku: string): string =>
  `${INVENTORY}/offer?sku=${encodeURIComponent(sku)}&marketplace_id=EBAY_US`;

/** An account with one policy of each type but two shipping ones, one of them chosen. */
export function ebaySettings(overrides: Partial<EbaySettings> = {}): EbaySettings {
  return {
    channel: ChannelType.Ebay,
    marketplaceId: EbayMarketplaceId.UnitedStates,
    currencyCode: 'USD',
    username: 'demo_seller',
    userId: 'nY4uWx2bQ1e',
    businessPoliciesEnabled: true,
    policies: {
      fulfillment: [
        { id: '6000000001', name: 'Free shipping' },
        { id: '6000000002', name: 'Express' },
      ],
      payment: [{ id: '6100000001', name: 'Managed payments' }],
      return: [{ id: '6200000001', name: '30 days' }],
    },
    listingDefaults: {
      fulfillmentPolicyId: '6000000002',
      paymentPolicyId: null,
      returnPolicyId: null,
      condition: EbayCondition.New,
      location: { postalCode: '95125', country: 'US', city: 'San Jose' },
      merchantLocationKey: EBAY_MERCHANT_LOCATION_KEY,
    },
    ...overrides,
  };
}

const VARIANT_DEFAULTS = {
  compareAtPrice: null,
  unitCost: null,
  tracked: true,
  weightGrams: null,
  requiresShipping: true,
  taxable: true,
  continueSellingWhenOutOfStock: false,
};

/** Size S keeps its SKU; size M's has a space, so eBay gets one derived from its id. */
function shirtVariants(): ListingDraft['variants'] {
  return [
    {
      ...VARIANT_DEFAULTS,
      variantId: VARIANT_S,
      sku: 'SHIRT-S',
      barcode: '4006381333931',
      optionValues: ['S'],
      price: '24.99',
      available: 7,
    },
    {
      ...VARIANT_DEFAULTS,
      variantId: VARIANT_M,
      sku: 'SHIRT M',
      barcode: null,
      optionValues: ['M'],
      price: '26.99',
      available: 0,
    },
  ];
}

/** A shirt in two sizes: a multi-variant listing through an inventory item group. */
export function shirtDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: SHIRT_ID,
    product: {
      handle: 'linen-shirt',
      title: 'Linen shirt',
      descriptionHtml: '<p>Breathable.</p>',
      vendor: 'Acme',
      productType: 'Shirts',
      tags: [],
      active: true,
      optionNames: ['Size'],
      images: [
        { url: 'https://cdn.example.com/shirt.jpg', altText: null },
        { url: 'http://insecure.example.com/shirt.jpg', altText: null },
      ],
    },
    variants: shirtVariants(),
    accountSettings: ebaySettings(),
    category: { id: '57990', name: 'Clothing, Shoes & Accessories > Men > Shirts' },
    ...overrides,
  };
}

/** A mug without options: a single-variant listing, with no category chosen yet. */
export function mugDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: MUG_ID,
    product: {
      handle: 'mug',
      title: 'Stoneware mug',
      descriptionHtml: '',
      vendor: null,
      productType: null,
      tags: [],
      active: true,
      optionNames: [],
      images: [],
    },
    variants: [
      {
        ...VARIANT_DEFAULTS,
        variantId: MUG_VARIANT,
        sku: null,
        barcode: '012345678905',
        optionValues: [],
        price: '12.00',
        available: 3,
        tracked: true,
      },
    ],
    accountSettings: ebaySettings(),
    category: null,
    ...overrides,
  };
}
