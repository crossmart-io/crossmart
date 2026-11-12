import type { ChannelContentLimits } from '../sdk/content/channel-content-limits.js';
import { DescriptionFormat } from '../sdk/content/description-format.enum.js';
import {
  MERCADOLIBRE_DESCRIPTION_MAX_LENGTH,
  MERCADOLIBRE_DESCRIPTION_TARGET_LENGTH,
  MERCADOLIBRE_TITLE_MAX_LENGTH,
} from './mercadolibre.constants.js';

/**
 * Mercado Libre takes descriptions as plain text only, with line breaks, so Crossmart writes
 * basic HTML without links and sends it as text.
 */
export const MERCADOLIBRE_CONTENT_LIMITS: ChannelContentLimits = {
  titleMaxLength: MERCADOLIBRE_TITLE_MAX_LENGTH,
  descriptionMaxLength: MERCADOLIBRE_DESCRIPTION_MAX_LENGTH,
  descriptionTargetLength: MERCADOLIBRE_DESCRIPTION_TARGET_LENGTH,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
};
