import { ChannelType } from '@crossmart/connectors';
import { DescriptionFormat } from '../enums/description-format.enum.js';

/** What a channel accepts in a listing's title and description, and how to write for it. */
export interface ChannelContentRules {
  /** The channel's name, as the agent is told it. */
  channelName: string;
  titleMaxLength: number;
  descriptionMaxLength: number;
  descriptionFormat: DescriptionFormat;
  /** Whether a description may link out. */
  allowsLinks: boolean;
  /** Channel-specific writing rules, given to the agent as a list. */
  guidance: readonly string[];
}

const SHOPIFY_RULES: ChannelContentRules = {
  channelName: 'Shopify (the merchant’s own online store)',
  titleMaxLength: 255,
  descriptionMaxLength: 5_000,
  descriptionFormat: DescriptionFormat.RichHtml,
  allowsLinks: true,
  guidance: [
    'Write a clear, brand-friendly title: product name first, then the key attribute.',
    'The description is rich HTML for a product page: a short intro paragraph, then a <ul> of benefits and specifications, using <h3> for sections when useful.',
    'Write for search engines and shoppers alike: use the words a shopper would search for, naturally.',
  ],
};

const EBAY_RULES: ChannelContentRules = {
  channelName: 'eBay',
  titleMaxLength: 80,
  descriptionMaxLength: 4_000,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
  guidance: [
    'eBay titles are at most 80 characters. Lead with brand, product type and the attributes buyers filter by (model, size, colour, material).',
    'Titles are plain text: no HTML, no promotional words (such as "free shipping", "sale", "best", "L@@K"), no ALL CAPS words and no repeated punctuation.',
    'The description uses basic HTML only (<p>, <ul>, <li>, <strong>, <em>): no links, scripts, images, contact details or promotional text.',
    'State condition-neutral facts only; the condition is set elsewhere on the listing.',
  ],
};

const GOOGLE_MERCHANT_RULES: ChannelContentRules = {
  channelName: 'Google Shopping (Google Merchant Center)',
  titleMaxLength: 150,
  descriptionMaxLength: 5_000,
  descriptionFormat: DescriptionFormat.BasicHtml,
  allowsLinks: false,
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
  titleMaxLength: 255,
  descriptionMaxLength: 5_000,
  descriptionFormat: DescriptionFormat.RichHtml,
  allowsLinks: false,
  guidance: [
    'Write a clear, descriptive title: product name first, then the attributes that tell variants and similar products apart. No promotional words.',
    'The description is HTML for any sales channel: a short intro paragraph, then a <ul> of features and specifications. No links, prices, shipping or store-specific details.',
  ],
};

/**
 * Content rules per channel. A channel without rules here cannot have content generated yet;
 * adding its entry is all it takes.
 */
export const CHANNEL_CONTENT_RULES: Readonly<Partial<Record<ChannelType, ChannelContentRules>>> = {
  [ChannelType.Shopify]: SHOPIFY_RULES,
  [ChannelType.Ebay]: EBAY_RULES,
  [ChannelType.GoogleMerchant]: GOOGLE_MERCHANT_RULES,
};

export function contentRulesFor(channel: ChannelType): ChannelContentRules | null {
  return CHANNEL_CONTENT_RULES[channel] ?? null;
}
