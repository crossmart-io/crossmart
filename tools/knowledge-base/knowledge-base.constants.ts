/** Where the docs site keeps its pages, inside a crossmart-docs checkout. */
export const DOCS_CONTENT_DIR = 'src/content/docs';
export const DOCS_SITE_URL = 'https://docs.crossmart.io';
export const SITE_URL = 'https://crossmart.io';

/**
 * crossmart.io publishes its pages as Markdown at this address (llms.txt). Its `##` sections
 * are the home page's sections; `SITE_SECTIONS` says where each one is on the page.
 */
export const SITE_LLMS_URL = `${SITE_URL}/llms.txt`;

/** A `##` section of crossmart.io's llms.txt, and where people read it on the site. */
export interface SiteSection {
  heading: string;
  /** The home page section's id. */
  anchor: string;
  /** The chunk title: what the section is about, in the words people ask with. */
  title: string;
}

/**
 * The sections of crossmart.io that Ask learns from. Sections not listed (the page list and
 * contact details) are left out: they hold links, not answers.
 */
export const SITE_SECTIONS: readonly SiteSection[] = [
  {
    heading: 'Integrations',
    anchor: 'channels',
    title: 'Marketplaces and channels Crossmart supports',
  },
  { heading: 'Cloud or self-hosted', anchor: 'hosting', title: 'Crossmart Cloud or self-hosted' },
  { heading: 'Questions and answers', anchor: 'faq', title: 'Crossmart FAQ' },
];

export const MARKDOWN_EXTENSIONS = ['.md', '.mdx'];
export const INDEX_PAGE = 'index';

/** A chunk's text stays under this many characters (about 450 tokens). */
export const MAX_CHUNK_LENGTH = 1800;
/** Sections shorter than this are folded into the previous chunk of the page. */
export const MIN_SECTION_LENGTH = 120;

export const OUTPUT_FILE = 'libs/core/src/ask/knowledge/docs-knowledge.generated.ts';
export const DOCS_DIR_FLAG = '--docs-dir';
export const DEFAULT_DOCS_DIR = '../crossmart-docs';
export const TITLE_SEPARATOR = ' › ';
