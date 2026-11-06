/** Where the docs site keeps its pages, inside a crossmart-docs checkout. */
export const DOCS_CONTENT_DIR = 'src/content/docs';
export const DOCS_SITE_URL = 'https://docs.crossmart.io';
/** Public URLs of this repository's documents. */
export const REPOSITORY_URL = 'https://github.com/crossmart-io/crossmart';
export const REPOSITORY_BLOB_URL = `${REPOSITORY_URL}/blob/main`;

/**
 * This repository's documents that are public and not already on the docs site. ADRs and the
 * architecture notes are left out: they are for contributors, and hold internal reasoning.
 */
export const REPOSITORY_DOCUMENTS = ['README.md', 'docs/channels', 'docs/developers/agents'];
export const ROOT_README = 'README.md';

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
