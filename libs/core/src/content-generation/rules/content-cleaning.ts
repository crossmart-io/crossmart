import { sanitizeDescriptionHtml, toPlainText } from '@crossmart/common';
import type { ChannelContentRules } from './channel-content-rules.js';

/** Titles are plain text on every channel. */
export function cleanTitle(title: string): string {
  return toPlainText(title);
}

/** Keeps only the markup the channel takes. */
export function cleanDescription(descriptionHtml: string, rules: ChannelContentRules): string {
  return sanitizeDescriptionHtml(descriptionHtml, { allowLinks: rules.allowsLinks });
}
