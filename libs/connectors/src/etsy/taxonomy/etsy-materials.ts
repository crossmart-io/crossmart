import {
  type CategoryAspect,
  CategoryAspectMode,
  CategoryAspectUsage,
} from '../../sdk/capabilities/taxonomy-provider.js';

/** The item specific whose values Crossmart sends as the listing's Etsy materials. */
export const ETSY_MATERIALS_SPECIFIC = 'Materials';

/**
 * The item specifics Etsy listings take through Crossmart: materials, in every category.
 * Etsy's category attributes (listing properties) are not written yet.
 */
export const ETSY_LISTING_ASPECTS: readonly CategoryAspect[] = [
  {
    name: ETSY_MATERIALS_SPECIFIC,
    required: false,
    usage: CategoryAspectUsage.Recommended,
    mode: CategoryAspectMode.FreeText,
    multiple: true,
    values: [],
  },
];
