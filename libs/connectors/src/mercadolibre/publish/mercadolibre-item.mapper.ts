import { descriptionToPlainText, FixedDecimal, truncate } from '@crossmart/common';
import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  MERCADOLIBRE_DEFAULT_LISTING_TYPE,
  MERCADOLIBRE_PICTURE_MAX_COUNT,
  MERCADOLIBRE_TITLE_MAX_LENGTH,
  MERCADOLIBRE_UNTRACKED_QUANTITY,
} from '../mercadolibre.constants.js';
import { MercadoLibreBuyingMode } from '../mercadolibre.enums.js';
import { MERCADOLIBRE_SITES } from '../mercadolibre-site.js';
import type { MercadoLibreSettings } from '../mercadolibre-settings.js';
import { mercadoLibreCondition } from './mercadolibre-condition.js';
import type { MercadoLibreItemInput, MercadoLibrePictureInput } from './mercadolibre-item.types.js';

const WHITESPACE_RUN = /\s+/gu;
const SINGLE_SPACE = ' ';

/** Units a variant lists: its stock (never below 0), or 1 when stock is not tracked. */
export function listedQuantity(variant: ListingDraftVariant): number {
  return variant.tracked ? Math.max(variant.available ?? 0, 0) : MERCADOLIBRE_UNTRACKED_QUANTITY;
}

/** A decimal price as the number Mercado Libre takes, rounded to the currency's decimals. */
export function mercadoLibrePrice(price: string, settings: MercadoLibreSettings): number {
  const decimals = MERCADOLIBRE_SITES[settings.siteId].currencyDecimals;
  return Number((FixedDecimal.parse(price) ?? FixedDecimal.ZERO).toFixed(decimals));
}

/** The title (or User Products family name): one line, at most 60 characters. */
export function mercadoLibreTitle(draft: ListingDraft): string {
  const title = draft.product.title.replace(WHITESPACE_RUN, SINGLE_SPACE).trim();
  return truncate(title, MERCADOLIBRE_TITLE_MAX_LENGTH).trim();
}

/** Descriptions are plain text with line breaks; the title stands in for an empty one. */
export function mercadoLibreDescription(draft: ListingDraft): string {
  return descriptionToPlainText(draft.product.descriptionHtml).trim() || draft.product.title;
}

/** The product's image URLs, for Mercado Libre to download, as many as an item takes. */
export function listingPictures(draft: ListingDraft): MercadoLibrePictureInput[] {
  return draft.product.images
    .slice(0, MERCADOLIBRE_PICTURE_MAX_COUNT)
    .map((image) => ({ source: image.url }));
}

/** What every new item has: its category, currency, terms and condition. */
export function newItemTerms(
  draft: ListingDraft,
  settings: MercadoLibreSettings,
  categoryId: string,
): MercadoLibreItemInput {
  return {
    category_id: categoryId,
    currency_id: settings.currencyCode,
    buying_mode: MercadoLibreBuyingMode.BuyItNow,
    listing_type_id: MERCADOLIBRE_DEFAULT_LISTING_TYPE,
    condition: mercadoLibreCondition(draft.condition),
  };
}

/** The pictures of an update: sent only when they changed, as Mercado Libre downloads them again. */
export function changedPictures(draft: ListingDraft): Pick<MercadoLibreItemInput, 'pictures'> {
  return draft.imagesChanged === false ? {} : { pictures: listingPictures(draft) };
}
