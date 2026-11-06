import type { ChannelContentLimits } from '../sdk/content/channel-content-limits.js';
import { DescriptionFormat } from '../sdk/content/description-format.enum.js';
import {
  GOOGLE_DESCRIPTION_MAX_LENGTH,
  GOOGLE_TITLE_MAX_LENGTH,
} from './google-merchant.constants.js';

/** Google shows descriptions as plain text, so basic HTML and no links. */
export const GOOGLE_MERCHANT_CONTENT_LIMITS: ChannelContentLimits = {
  titleMaxLength: GOOGLE_TITLE_MAX_LENGTH,
  descriptionMaxLength: GOOGLE_DESCRIPTION_MAX_LENGTH,
  descriptionTargetLength: GOOGLE_DESCRIPTION_MAX_LENGTH,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
};
