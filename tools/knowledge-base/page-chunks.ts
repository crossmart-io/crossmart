import type { KnowledgeChunk } from '../../libs/core/src/ask/entities/knowledge-chunk.js';
import type { KnowledgeSourceKind } from '../../libs/core/src/ask/enums/knowledge-source-kind.enum.js';
import { MIN_SECTION_LENGTH, TITLE_SEPARATOR } from './knowledge-base.constants.js';
import { type MarkdownSection, splitSections } from './markdown-sections.js';
import { readFrontmatter, toPlainMarkdown } from './markdown-text.js';
import { splitText } from './text-pieces.js';

/** One document to chunk: where it comes from and where people read it. */
export interface KnowledgePage {
  source: KnowledgeSourceKind;
  /** Its path in the source repository, for chunk ids. */
  path: string;
  /** The public URL of the page, without an anchor. */
  url: string;
  /** Used when the page has neither a frontmatter title nor a `#` heading. */
  fallbackTitle: string;
  content: string;
}

interface SectionChunk {
  title: string;
  anchor: string | null;
  text: string;
}

const ANCHOR_MARK = '#';
const PART_MARK = '~';
const PARAGRAPH_BREAK = '\n\n';

/** Short sections join the one before, so no chunk is a lone heading and a sentence. */
function mergeShort(sections: readonly SectionChunk[]): SectionChunk[] {
  const merged: SectionChunk[] = [];
  for (const section of sections) {
    const previous = merged[merged.length - 1];
    if (previous && section.text.length < MIN_SECTION_LENGTH) {
      previous.text = `${previous.text}${PARAGRAPH_BREAK}${section.title}${PARAGRAPH_BREAK}${section.text}`;
    } else {
      merged.push({ ...section });
    }
  }
  return merged;
}

function sectionTitle(pageTitle: string, section: MarkdownSection): string {
  return section.heading ? `${pageTitle}${TITLE_SEPARATOR}${section.heading}` : pageTitle;
}

function toChunks(page: KnowledgePage, section: SectionChunk): KnowledgeChunk[] {
  const anchor = section.anchor ? `${ANCHOR_MARK}${section.anchor}` : '';
  return splitText(section.text).map((text, part) => ({
    id: `${page.source}:${page.path}${anchor}${part ? `${PART_MARK}${part + 1}` : ''}`,
    source: page.source,
    title: section.title,
    url: `${page.url}${anchor}`,
    text,
  }));
}

/** The frontmatter description opens the page's first, untitled section. */
function withDescription(
  sections: readonly MarkdownSection[],
  description: string | null,
): MarkdownSection[] {
  if (!description) return [...sections];
  const [first, ...rest] = sections;
  if (first && first.heading === null) {
    return [{ ...first, text: `${description}${PARAGRAPH_BREAK}${first.text}` }, ...rest];
  }
  return [{ heading: null, anchor: null, text: description }, ...sections];
}

/** A page as knowledge chunks: one per section, split when long, titled "Page › Section". */
export function pageChunks(page: KnowledgePage): KnowledgeChunk[] {
  const { title, description, body } = readFrontmatter(page.content);
  const { pageTitle, sections } = splitSections(toPlainMarkdown(body));
  const resolvedTitle = title ?? pageTitle ?? page.fallbackTitle;
  const drafts = withDescription(sections, description).map((section) => ({
    title: sectionTitle(resolvedTitle, section),
    anchor: section.anchor,
    text: section.text,
  }));
  return mergeShort(drafts).flatMap((section) => toChunks(page, section));
}
