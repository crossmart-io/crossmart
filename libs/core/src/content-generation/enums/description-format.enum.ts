/** How much markup a channel's descriptions take. */
export enum DescriptionFormat {
  /** Headings, lists, tables and links (Shopify). */
  RichHtml = 'rich_html',
  /** Paragraphs, emphasis and lists; no links or active content (eBay). */
  BasicHtml = 'basic_html',
}
