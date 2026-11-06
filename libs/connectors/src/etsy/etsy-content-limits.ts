import type { ChannelContentLimits } from '../sdk/content/channel-content-limits.js';
import { DescriptionFormat } from '../sdk/content/description-format.enum.js';
import {
  ETSY_DESCRIPTION_TARGET_LENGTH,
  ETSY_TAG_MAX_COUNT,
  ETSY_TAG_MAX_LENGTH,
  ETSY_TITLE_MAX_LENGTH,
} from './etsy.constants.js';

/**
 * Etsy shows descriptions as plain text, so Crossmart writes basic HTML without links and
 * sends it as text. Etsy states no description limit.
 */
export const ETSY_CONTENT_LIMITS: ChannelContentLimits = {
  titleMaxLength: ETSY_TITLE_MAX_LENGTH,
  descriptionMaxLength: null,
  descriptionTargetLength: ETSY_DESCRIPTION_TARGET_LENGTH,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
  tagMaxCount: ETSY_TAG_MAX_COUNT,
  tagMaxLength: ETSY_TAG_MAX_LENGTH,
};
