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

/**
 * Content rules per channel. A channel without rules here cannot have content generated yet;
 * adding its entry is all it takes.
 */
export const CHANNEL_CONTENT_RULES: Readonly<Partial<Record<ChannelType, ChannelContentRules>>> = {
  [ChannelType.Shopify]: SHOPIFY_RULES,
  [ChannelType.Ebay]: EBAY_RULES,
};

export function contentRulesFor(channel: ChannelType): ChannelContentRules | null {
  return CHANNEL_CONTENT_RULES[channel] ?? null;
}
