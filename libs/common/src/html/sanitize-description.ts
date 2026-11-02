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

/**
 * Descriptions come from imports, agents and the editor, and are published to marketplaces.
 * Scripts, styles, event handlers and unsafe links never survive.
 */
export function sanitizeDescriptionHtml(html: string): string {
  return sanitizeHtml(html, DESCRIPTION_HTML_OPTIONS).trim();
}
