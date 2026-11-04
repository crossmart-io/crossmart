import { slugify } from '@crossmart/common';
import {
  FALLBACK_WORKSPACE_SLUG,
  FIRST_SLUG_SUFFIX,
  SLUG_SUFFIX_SEPARATOR,
} from '../tenancy.constants.js';

/** The slug of `name`, numbered when it is taken: "EU store" → "eu-store", then "eu-store-2". */
export function uniqueSlug(name: string, taken: readonly string[]): string {
  const base = slugify(name) || FALLBACK_WORKSPACE_SLUG;
  if (!taken.includes(base)) return base;
  let suffix = FIRST_SLUG_SUFFIX;
  while (taken.includes(`${base}${SLUG_SUFFIX_SEPARATOR}${suffix}`)) suffix += 1;
  return `${base}${SLUG_SUFFIX_SEPARATOR}${suffix}`;
}
