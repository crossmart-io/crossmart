import { truncate } from '@crossmart/common';
import {
  ETSY_MATERIAL_DISALLOWED,
  ETSY_PROPERTY_VALUE_DISALLOWED,
  ETSY_TAG_DISALLOWED,
  ETSY_TAG_LEADING_DISALLOWED,
  ETSY_TAG_MAX_COUNT,
  ETSY_TAG_MAX_LENGTH,
  ETSY_TITLE_DISALLOWED,
  ETSY_TITLE_MAX_LENGTH,
  ETSY_TITLE_SINGLE_USE_CHARACTERS,
  SINGLE_SPACE,
  WHITESPACE_RUN,
} from '../etsy.constants.js';

function collapseSpaces(text: string): string {
  return text.replace(WHITESPACE_RUN, SINGLE_SPACE).trim();
}

/** Keeps the first of each character Etsy allows once in a title (`%`, `:`, `&`, `+`). */
function keepFirstOnly(text: string): string {
  const seen = new Set<string>();
  return Array.from(text)
    .filter((character) => {
      if (!ETSY_TITLE_SINGLE_USE_CHARACTERS.includes(character)) return true;
      if (seen.has(character)) return false;
      seen.add(character);
      return true;
    })
    .join('');
}

/** A title Etsy accepts: allowed characters only, `% : & +` once each, at most 140. */
export function etsyTitle(title: string): string {
  const cleaned = collapseSpaces(keepFirstOnly(title.replace(ETSY_TITLE_DISALLOWED, '')));
  return truncate(cleaned, ETSY_TITLE_MAX_LENGTH).trim();
}

function etsyTag(tag: string): string {
  const cleaned = collapseSpaces(tag.replace(ETSY_TAG_DISALLOWED, '')).replace(
    ETSY_TAG_LEADING_DISALLOWED,
    '',
  );
  return truncate(cleaned, ETSY_TAG_MAX_LENGTH).trim();
}

/** Uniques by lower case, keeping the first spelling and the order. */
function uniqueIgnoringCase(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (value.length === 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Up to 13 tags Etsy accepts: letters, numbers, spaces, `-` and `'` (not leading), ™ © ®, at
 * most 20 characters each, without repeats.
 */
export function etsyTags(tags: readonly string[]): string[] {
  return uniqueIgnoringCase(tags.map(etsyTag)).slice(0, ETSY_TAG_MAX_COUNT);
}

/** Materials Etsy accepts: letters, numbers and spaces, without repeats. */
export function etsyMaterials(materials: readonly string[]): string[] {
  return uniqueIgnoringCase(
    materials.map((material) => collapseSpaces(material.replace(ETSY_MATERIAL_DISALLOWED, ''))),
  );
}

/** A variation value Etsy accepts: no parentheses. */
export function etsyPropertyValue(value: string): string {
  return collapseSpaces(value.replace(ETSY_PROPERTY_VALUE_DISALLOWED, ''));
}
