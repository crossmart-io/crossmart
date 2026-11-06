import type { ChannelContentLimits } from '../sdk/content/channel-content-limits.js';
import { DescriptionFormat } from '../sdk/content/description-format.enum.js';
import {
  EBAY_DESCRIPTION_MAX_LENGTH,
  EBAY_DESCRIPTION_TARGET_LENGTH,
  EBAY_TITLE_MAX_LENGTH,
} from './ebay.constants.js';

/** eBay listings take basic HTML without links (eBay's active content policy). */
export const EBAY_CONTENT_LIMITS: ChannelContentLimits = {
  titleMaxLength: EBAY_TITLE_MAX_LENGTH,
  descriptionMaxLength: EBAY_DESCRIPTION_MAX_LENGTH,
  descriptionTargetLength: EBAY_DESCRIPTION_TARGET_LENGTH,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
};
