import sanitizeHtml from 'sanitize-html';

const LINK_TAG = 'a';

/** The formatting a product description may keep. Everything else is removed. */
const DESCRIPTION_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: { [LINK_TAG]: ['href', 'title', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    [LINK_TAG]: sanitizeHtml.simpleTransform(LINK_TAG, { rel: 'noopener noreferrer nofollow' }),
  },
};

/** The same formatting without links, for channels that forbid linking out (eBay). */
const LINKLESS_DESCRIPTION_HTML_OPTIONS: sanitizeHtml.IOptions = {
  ...DESCRIPTION_HTML_OPTIONS,
  allowedTags: (DESCRIPTION_HTML_OPTIONS.allowedTags || []).filter((tag) => tag !== LINK_TAG),
};

/** Any tag, for titles, which carry no markup. Entities are left as typed: "Tom & Jerry". */
const MARKUP_TAG = /<[^>]*>/g;
const WHITESPACE_RUN = /\s+/g;
const SINGLE_SPACE = ' ';

export interface DescriptionSanitizeOptions {
  /** Keep links (as `rel="nofollow"`); true unless the channel forbids them. */
  allowLinks?: boolean;
}

/**
 * Descriptions come from imports, agents and the editor, and are published to marketplaces.
 * Scripts, styles, event handlers and unsafe links never survive.
 */
export function sanitizeDescriptionHtml(
  html: string,
  { allowLinks = true }: DescriptionSanitizeOptions = {},
): string {
  const options = allowLinks ? DESCRIPTION_HTML_OPTIONS : LINKLESS_DESCRIPTION_HTML_OPTIONS;
  return sanitizeHtml(html, options).trim();
}

/** Text without any markup and with whitespace collapsed, such as a title from an agent. */
export function toPlainText(text: string): string {
  return text.replace(MARKUP_TAG, SINGLE_SPACE).replace(WHITESPACE_RUN, SINGLE_SPACE).trim();
}

/** Tags that start a new line: list items, table rows and line breaks. Their ends add nothing. */
const LINE_START = /<(?:li|tr|br)\b[^>]*>/gi;
const LINE_END = /<\/(?:li|tr)>/gi;
/** Tags that open or close a paragraph-like block. */
const BLOCK_BOUNDARY = /<\/?(?:p|div|ul|ol|h[1-6]|table|thead|tbody|blockquote)\b[^>]*>/gi;
const LINE_BREAK = '\n';
const BLANK_LINES = /\n{3,}/g;
const SPACES = /[ \t\u00a0]+/g;
const PARAGRAPH_BREAK = '\n\n';
const NO_MARKUP: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} };

/** The entities `sanitize-html` writes into text, back to the characters they stand for. */
const TEXT_ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};
const TEXT_ENTITY = /&(?:amp|lt|gt|quot|#39|nbsp);/g;

/**
 * A description as plain text, for channels that take no HTML (Google): block tags become line
 * breaks, inline tags vanish without adding spaces, scripts and styles are dropped with their
 * content, and entities are decoded. At most one blank line separates paragraphs.
 */
export function descriptionToPlainText(html: string): string {
  const lines = html
    .replace(LINE_END, '')
    .replace(LINE_START, LINE_BREAK)
    .replace(BLOCK_BOUNDARY, PARAGRAPH_BREAK);
  const text = sanitizeHtml(lines, NO_MARKUP).replace(
    TEXT_ENTITY,
    (entity) => TEXT_ENTITIES[entity] ?? entity,
  );
  return text
    .split(LINE_BREAK)
    .map((line) => line.replace(SPACES, SINGLE_SPACE).trim())
    .join(LINE_BREAK)
    .replace(BLANK_LINES, PARAGRAPH_BREAK)
    .trim();
}
