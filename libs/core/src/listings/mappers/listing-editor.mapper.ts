import { ListingVisibility, ProductStatus } from '@crossmart/database';
import type { ProductDetail, VariantView } from '../../catalog/entities/product-views.js';
import type {
  InheritedField,
  ListingEditorVariant,
  ListingEditorView,
  ListingItemSpecificsSummary,
} from '../entities/listing-editor.js';
import type {
  ListingOverrideInput,
  VariantPriceOverrideInput,
} from '../entities/listing-override.js';
import type { ChannelVariantView, ProductChannelView } from '../entities/listing-views.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { effectiveImageUrls } from '../rules/listing-images.js';

/** What the editor reads beyond the store view: the product, its listing, the channel's features. */
export interface ListingEditorSource {
  channel: ProductChannelView;
  product: ProductDetail;
  listing: ListingSyncRecord | null;
  /** Whether the channel has categories and item specifics (eBay). */
  hasTaxonomy: boolean;
}

/** A field that follows the product unless the store overrides it. */
export function inheritedField<TValue>(
  product: TValue,
  override: TValue | null,
): InheritedField<TValue> {
  return { product, override, effective: override ?? product, overridden: override !== null };
}

/** A product's own visibility: shown when it is active. */
function productVisibility(status: ProductStatus): ListingVisibility {
  return status === ProductStatus.ACTIVE ? ListingVisibility.VISIBLE : ListingVisibility.HIDDEN;
}

/** A price field whose effective value the pricing rule may change even without an override. */
function priceField<TValue extends string | null>(
  product: TValue,
  override: TValue | null,
  effective: TValue,
): InheritedField<TValue> {
  return { product, override, effective, overridden: override !== null };
}

function editorVariant(
  variant: VariantView,
  channelVariant: ChannelVariantView | undefined,
  override: VariantPriceOverrideInput | undefined,
): ListingEditorVariant | null {
  if (!channelVariant) return null;
  const resolved = channelVariant.price;
  return {
    variantId: variant.id,
    title: channelVariant.title,
    sku: variant.sku,
    price: priceField(variant.price, override?.price ?? null, resolved.price),
    compareAtPrice: priceField(
      variant.compareAtPrice,
      override?.compareAtPrice ?? null,
      resolved.compareAtPrice,
    ),
    resolvedPrice: resolved,
    quantity: channelVariant.quantity,
  };
}

function editorVariants(
  product: ProductDetail,
  channel: ProductChannelView,
): ListingEditorVariant[] {
  const channelVariants = new Map(channel.variants.map((entry) => [entry.variantId, entry]));
  const overrides = new Map(
    (channel.override?.variantPrices ?? []).map((entry) => [entry.variantId, entry]),
  );
  return product.variants.flatMap((variant) => {
    const view = editorVariant(variant, channelVariants.get(variant.id), overrides.get(variant.id));
    return view ? [view] : [];
  });
}

function itemSpecificsSummary(
  listing: ListingSyncRecord | null,
  supported: boolean,
): ListingItemSpecificsSummary {
  const names = supported ? (listing?.itemSpecifics ?? []).map((entry) => entry.name) : [];
  return { supported, count: names.length, names };
}

/** Overrides of a listing that has none: every field follows the product. */
const FOLLOWS_PRODUCT: ListingOverrideInput = {
  title: null,
  descriptionHtml: null,
  tags: null,
  mediaUrls: null,
  visibility: null,
  inventoryBuffer: null,
  maxQuantity: null,
  variantPrices: [],
};

/** The images: the product's, the chosen subset, and what the store shows. */
function imagesField(product: ProductDetail, chosen: string[] | null): InheritedField<string[]> {
  const productImages = product.media.map((media) => media.url);
  const mediaOverride = { mediaOverridden: chosen !== null, mediaUrls: chosen ?? [] };
  return {
    ...inheritedField(productImages, chosen),
    effective: effectiveImageUrls(productImages, mediaOverride),
  };
}

/** The content fields: title, description, tags, images and visibility. */
function contentFields(
  product: ProductDetail,
  override: ListingOverrideInput,
): Pick<ListingEditorView, 'title' | 'descriptionHtml' | 'tags' | 'images' | 'visibility'> {
  return {
    title: inheritedField(product.title, override.title),
    descriptionHtml: inheritedField(product.descriptionHtml, override.descriptionHtml),
    tags: inheritedField(product.tags, override.tags),
    images: imagesField(product, override.mediaUrls),
    visibility: inheritedField(productVisibility(product.status), override.visibility),
  };
}

/** One product on one store, every field with the product's value, its override and the result. */
export function toListingEditorView(source: ListingEditorSource): ListingEditorView {
  const { channel, product, listing, hasTaxonomy } = source;
  const override = channel.override ?? FOLLOWS_PRODUCT;
  return {
    productId: product.id,
    connection: channel.connection,
    selected: channel.selected,
    displayState: channel.displayState,
    displayReason: channel.displayReason,
    displayRequirement: channel.displayRequirement,
    listing: channel.listing,
    ...contentFields(product, override),
    stock: { inventoryBuffer: override.inventoryBuffer, maxQuantity: override.maxQuantity },
    variants: editorVariants(product, channel),
    category: {
      supported: hasTaxonomy,
      value: hasTaxonomy ? (channel.listing?.category ?? null) : null,
    },
    itemSpecifics: itemSpecificsSummary(listing, hasTaxonomy),
    overrideUpdatedAt: channel.override?.updatedAt ?? null,
  };
}
