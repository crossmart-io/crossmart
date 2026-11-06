import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname, join, relative, sep } from 'node:path';
import { KnowledgeSourceKind } from '../../libs/core/src/ask/enums/knowledge-source-kind.enum.js';
import {
  DOCS_CONTENT_DIR,
  DOCS_SITE_URL,
  INDEX_PAGE,
  MARKDOWN_EXTENSIONS,
} from './knowledge-base.constants.js';
import type { KnowledgePage } from './page-chunks.js';

const URL_SEPARATOR = '/';

function isMarkdown(path: string): boolean {
  return MARKDOWN_EXTENSIONS.includes(extname(path));
}

/** Markdown files under a file or folder, in a stable (sorted) order. */
async function markdownFiles(path: string): Promise<string[]> {
  if (!(await stat(path)).isDirectory()) return isMarkdown(path) ? [path] : [];
  const entries = await readdir(path, { recursive: true });
  return entries
    .map((entry) => join(path, entry))
    .filter(isMarkdown)
    .sort();
}

/** `developers/sdks/python.mdx` → `https://docs.crossmart.io/developers/sdks/python/`. */
export function docsPageUrl(relativePath: string): string {
  const parts = relativePath.slice(0, -extname(relativePath).length).split(sep);
  const slug = parts.at(-1) === INDEX_PAGE ? parts.slice(0, -1) : parts;
  return slug.length ? `${DOCS_SITE_URL}/${slug.join(URL_SEPARATOR)}/` : `${DOCS_SITE_URL}/`;
}

async function toDocsPage(path: string, file: string): Promise<KnowledgePage> {
  return {
    source: KnowledgeSourceKind.Docs,
    path,
    url: docsPageUrl(path),
    linksSections: true,
    fallbackTitle: basename(file, extname(file)),
    content: await readFile(file, 'utf8'),
  };
}

/** Every page of a crossmart-docs checkout. */
export async function docsPages(docsDir: string): Promise<KnowledgePage[]> {
  const contentDir = join(docsDir, DOCS_CONTENT_DIR);
  const files = await markdownFiles(contentDir);
  return Promise.all(files.map((file) => toDocsPage(relative(contentDir, file), file)));
}
