import { type ChannelContentLimits, ChannelType, DescriptionFormat } from '@crossmart/connectors';
import {
  CATALOG_DESCRIPTION_MAX_LENGTH,
  CATALOG_TITLE_MAX_LENGTH,
} from '../content-generation.constants.js';

/** What a channel accepts in a listing's title and description, and how to write for it. */
export interface ChannelContentRules {
  /** The channel's name, as the agent is told it. */
  channelName: string;
  titleMaxLength: number;
  /** The longest description to write: the channel's target, which never exceeds its limit. */
  descriptionMaxLength: number;
  descriptionFormat: DescriptionFormat;
  /** Whether a description may link out. */
  allowsLinks: boolean;
  /** Channel-specific writing rules, given to the agent as a list. */
  guidance: readonly string[];
}

/** How to write for a channel; the numbers come from its connector's `contentLimits`. */
export type ChannelContentGuidance = Pick<ChannelContentRules, 'channelName' | 'guidance'>;

const SHOPIFY_GUIDANCE: ChannelContentGuidance = {
  channelName: 'Shopify (the merchant’s own online store)',
  guidance: [
    'Write a clear, brand-friendly title: product name first, then the key attribute.',
    'The description is rich HTML for a product page: a short intro paragraph, then a <ul> of benefits and specifications, using <h3> for sections when useful.',
    'Write for search engines and shoppers alike: use the words a shopper would search for, naturally.',
  ],
};

const EBAY_GUIDANCE: ChannelContentGuidance = {
  channelName: 'eBay',
  guidance: [
    'eBay titles are at most 80 characters. Lead with brand, product type and the attributes buyers filter by (model, size, colour, material).',
    'Titles are plain text: no HTML, no promotional words (such as "free shipping", "sale", "best", "L@@K"), no ALL CAPS words and no repeated punctuation.',
    'The description uses basic HTML only (<p>, <ul>, <li>, <strong>, <em>): no links, scripts, images, contact details or promotional text.',
    'State condition-neutral facts only; the condition is set elsewhere on the listing.',
  ],
};

const GOOGLE_MERCHANT_GUIDANCE: ChannelContentGuidance = {
  channelName: 'Google Shopping (Google Merchant Center)',
  guidance: [
    'Titles lead with what shoppers search for: brand, product type, then key attributes (material, colour, size, model). No promotional text, ALL CAPS or prices.',
    'Google shows the description as plain text: write short paragraphs and simple lists; formatting is removed. No promotional text, links, shipping or store details.',
    'Describe the product accurately and specifically; Google disapproves misleading or vague listings.',
  ],
};

/**
 * The catalog: the merchant's own product content, which every store starts from. It is
 * written channel-neutral, for the merchant's site and as the base the stores adapt.
 */
export const CATALOG_CONTENT_RULES: ChannelContentRules = {
  channelName: 'the merchant’s product catalog (the master copy every sales channel starts from)',
  titleMaxLength: CATALOG_TITLE_MAX_LENGTH,
  descriptionMaxLength: CATALOG_DESCRIPTION_MAX_LENGTH,
  descriptionFormat: DescriptionFormat.RichHtml,
  allowsLinks: false,
  guidance: [
    'Write a clear, descriptive title: product name first, then the attributes that tell variants and similar products apart. No promotional words.',
    'The description is HTML for any sales channel: a short intro paragraph, then a <ul> of features and specifications. No links, prices, shipping or store-specific details.',
  ],
};

/**
 * Writing guidance per channel. A channel can have content generated once it has guidance
 * here and its connector declares `contentLimits`.
 */
export const CHANNEL_CONTENT_GUIDANCE: Readonly<
  Partial<Record<ChannelType, ChannelContentGuidance>>
> = {
  [ChannelType.Shopify]: SHOPIFY_GUIDANCE,
  [ChannelType.Ebay]: EBAY_GUIDANCE,
  [ChannelType.GoogleMerchant]: GOOGLE_MERCHANT_GUIDANCE,
};

/**
 * A channel's rules: its guidance, and its connector's limits. Descriptions are written to the
 * channel's target length, which may be well under its hard limit (eBay).
 */
export function channelContentRules(
  guidance: ChannelContentGuidance,
  limits: ChannelContentLimits,
): ChannelContentRules {
  return {
    ...guidance,
    titleMaxLength: limits.titleMaxLength,
    descriptionMaxLength: limits.descriptionTargetLength,
    descriptionFormat: limits.descriptionFormat,
    allowsLinks: limits.allowsLinks,
  };
}
