import { descriptionToPlainText, FixedDecimal } from '@crossmart/common';
import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  ETSY_LIST_SEPARATOR,
  ETSY_MIN_DRAFT_QUANTITY,
  ETSY_UNTRACKED_QUANTITY,
} from '../etsy.constants.js';
import { EtsyListingType } from '../etsy.enums.js';
import type { CompleteEtsyListingSetup } from '../listing/etsy-listing-setup.js';
import { ETSY_MATERIALS_SPECIFIC } from '../taxonomy/etsy-materials.js';
import { etsyMaterials, etsyTags, etsyTitle } from './etsy-text.js';

/** `createDraftListing` and `updateListing` form fields. */
enum ListingField {
  Title = 'title',
  Description = 'description',
  Tags = 'tags',
  Materials = 'materials',
  TaxonomyId = 'taxonomy_id',
  WhoMade = 'who_made',
  WhenMade = 'when_made',
  IsSupply = 'is_supply',
  ShippingProfileId = 'shipping_profile_id',
  ReadinessStateId = 'readiness_state_id',
  Type = 'type',
  Quantity = 'quantity',
  Price = 'price',
  State = 'state',
}

/** What a listing write needs besides the draft. */
export interface EtsyListingTerms {
  setup: CompleteEtsyListingSetup;
  taxonomyId: string;
}

type FormFields = Record<string, string>;

/** Units a variant lists: its stock (never below 0), or 1 when stock is not tracked. */
export function listedQuantity(variant: ListingDraftVariant): number {
  return variant.tracked ? Math.max(variant.available ?? 0, 0) : ETSY_UNTRACKED_QUANTITY;
}

/** Etsy descriptions are plain text, and required: the title stands in for an empty one. */
function etsyDescription(draft: ListingDraft): string {
  return descriptionToPlainText(draft.product.descriptionHtml).trim() || draft.product.title;
}

/** The merchant's `Materials` item specific: Etsy's materials. */
function materialsOf(draft: ListingDraft): string[] {
  const specific = (draft.itemSpecifics ?? []).find(
    ({ name }) => name.toLowerCase() === ETSY_MATERIALS_SPECIFIC.toLowerCase(),
  );
  return etsyMaterials(specific?.values ?? []);
}

/** A list field, comma-separated; absent when empty, as Etsy refuses empty tags. */
function listField(name: ListingField, values: readonly string[]): FormFields {
  return values.length > 0 ? { [name]: values.join(ETSY_LIST_SEPARATOR) } : {};
}

/** The fields `updateListing` takes: content, category, item details and shipping. */
export function listingFields(draft: ListingDraft, terms: EtsyListingTerms): FormFields {
  const { setup } = terms;
  return {
    [ListingField.Title]: etsyTitle(draft.product.title),
    [ListingField.Description]: etsyDescription(draft),
    ...listField(ListingField.Tags, etsyTags(draft.product.tags)),
    ...listField(ListingField.Materials, materialsOf(draft)),
    [ListingField.TaxonomyId]: terms.taxonomyId,
    [ListingField.WhoMade]: setup.whoMade,
    [ListingField.WhenMade]: setup.whenMade,
    [ListingField.IsSupply]: String(setup.isSupply),
    [ListingField.ShippingProfileId]: setup.shippingProfileId,
    [ListingField.Type]: EtsyListingType.Physical,
  };
}

/** The lowest variant price: Etsy's listing price is "the minimum possible price". */
function lowestPrice(variants: readonly ListingDraftVariant[]): string {
  const prices = variants.map(({ price }) => FixedDecimal.parse(price) ?? FixedDecimal.ZERO);
  const lowest = prices.reduce(
    (min, price) => (price.lessThan(min) ? price : min),
    prices[0] ?? FixedDecimal.ZERO,
  );
  return lowest.toString();
}

/**
 * The fields `createDraftListing` takes: the listing's, plus a positive quantity and price,
 * which the inventory then sets per variant, and the processing profile.
 */
export function draftFields(draft: ListingDraft, terms: EtsyListingTerms): FormFields {
  const quantity = draft.variants.reduce((sum, variant) => sum + listedQuantity(variant), 0);
  return {
    ...listingFields(draft, terms),
    [ListingField.Quantity]: String(Math.max(quantity, ETSY_MIN_DRAFT_QUANTITY)),
    [ListingField.Price]: lowestPrice(draft.variants),
    [ListingField.ReadinessStateId]: terms.setup.processingProfileId,
  };
}

/** The field that publishes or hides a listing. */
export function stateField(state: string): FormFields {
  return { [ListingField.State]: state };
}
