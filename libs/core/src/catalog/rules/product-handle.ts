import { randomBytes } from 'node:crypto';
import { slugify } from '@crossmart/common';
import {
  FALLBACK_HANDLE_ID_BYTES,
  FALLBACK_HANDLE_PREFIX,
  FALLBACK_HANDLE_SEPARATOR,
} from '../catalog.constants.js';

/** Hex encoding of the fallback handle's random id. */
const ID_ENCODING = 'hex';

/**
 * The handle a new product gets when none is given: its slugified title, or `product-<id>` when
 * the title has no Latin letters or digits to slugify (a Hebrew or Japanese title). Handles go
 * into product page addresses (Shopify, Google), so they stay ASCII. The id is random and kept
 * with the product, so the handle does not change later; the workspace still refuses a
 * duplicate handle as before.
 */
export function defaultProductHandle(title: string): string {
  const slug = slugify(title);
  if (slug) return slug;
  const id = randomBytes(FALLBACK_HANDLE_ID_BYTES).toString(ID_ENCODING);
  return `${FALLBACK_HANDLE_PREFIX}${FALLBACK_HANDLE_SEPARATOR}${id}`;
}
