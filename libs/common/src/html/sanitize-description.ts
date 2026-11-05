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
