const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/;
const FRONTMATTER_FIELD = (name: string): RegExp => new RegExp(`^${name}:\\s*(.+)$`, 'm');
const QUOTES = /^['"]|['"]$/g;
const MDX_IMPORT = /^import\s.+$/gm;
const LINK_CARD = /<LinkCard\s+title="([^"]*)"[^>]*?description="([^"]*)"[^>]*\/>/gs;
const JSX_TAG = /<\/?[A-Z][A-Za-z]*(?:\s[^>]*)?\/?>/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HTML_BLOCK_TAG = /<\/?(?:div|p|br|img)(?:\s[^>]*)?\/?>/gi;
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
const LINK = /\[([^\]]+)\]\([^)]*\)/g;
const GITHUB_ALERT = /^>\s*\[!\w+\]\s*$/gm;
const BLANK_RUNS = /\n{3,}/g;

/** A page's frontmatter title and description, and its body without the frontmatter. */
export interface MarkdownPage {
  title: string | null;
  description: string | null;
  body: string;
}

function field(frontmatter: string, name: string): string | null {
  const match = FRONTMATTER_FIELD(name).exec(frontmatter);
  return match ? match[1].trim().replace(QUOTES, '') : null;
}

export function readFrontmatter(source: string): MarkdownPage {
  const match = FRONTMATTER.exec(source);
  if (!match) return { title: null, description: null, body: source };
  return {
    title: field(match[1], 'title'),
    description: field(match[1], 'description'),
    body: source.slice(match[0].length),
  };
}

/**
 * Markdown and MDX as text a model reads well: components and HTML dropped (link cards kept
 * as "title: description"), links reduced to their text so the model never copies a URL.
 * Code blocks and tables are kept: commands and limits are what people ask about.
 */
export function toPlainMarkdown(body: string): string {
  return body
    .replace(MDX_IMPORT, '')
    .replace(LINK_CARD, '- $1: $2')
    .replace(JSX_TAG, '')
    .replace(HTML_COMMENT, '')
    .replace(HTML_BLOCK_TAG, '')
    .replace(IMAGE, '')
    .replace(LINK, '$1')
    .replace(GITHUB_ALERT, '')
    .replace(BLANK_RUNS, '\n\n')
    .trim();
}
