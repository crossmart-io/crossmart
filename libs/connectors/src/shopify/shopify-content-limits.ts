import type { ChannelContentLimits } from '../sdk/content/channel-content-limits.js';
import { DescriptionFormat } from '../sdk/content/description-format.enum.js';
import {
  SHOPIFY_DESCRIPTION_TARGET_LENGTH,
  SHOPIFY_TITLE_MAX_LENGTH,
} from './shopify.constants.js';

/** A product page on the merchant's own store: rich HTML, links allowed. */
export const SHOPIFY_CONTENT_LIMITS: ChannelContentLimits = {
  titleMaxLength: SHOPIFY_TITLE_MAX_LENGTH,
  descriptionMaxLength: null,
  descriptionTargetLength: SHOPIFY_DESCRIPTION_TARGET_LENGTH,
  descriptionFormat: DescriptionFormat.RichHtml,
  allowsLinks: true,
};
