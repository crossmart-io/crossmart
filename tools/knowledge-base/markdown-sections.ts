import { HeadingAnchors } from './heading-anchor.js';

/** A part of a page under one heading (or before the first one). */
export interface MarkdownSection {
  /** Null for the text before the first heading. */
  heading: string | null;
  anchor: string | null;
  text: string;
}

const HEADING = /^(?<marks>#{1,3})\s+(?<text>.+?)\s*#*$/;
const FENCE = /^\s*(```|~~~)/;
const PAGE_TITLE_LEVEL = 1;
const INLINE_CODE_TICKS = /`/g;

interface SectionDraft {
  heading: string | null;
  anchor: string | null;
  lines: string[];
}

function toSection(draft: SectionDraft): MarkdownSection {
  return { heading: draft.heading, anchor: draft.anchor, text: draft.lines.join('\n').trim() };
}

/** A heading line outside code: its level and text, or null. */
function headingOf(line: string, inCode: boolean): { level: number; text: string } | null {
  if (inCode) return null;
  const groups = HEADING.exec(line)?.groups;
  return groups
    ? { level: groups.marks.length, text: groups.text.replace(INLINE_CODE_TICKS, '') }
    : null;
}

/**
 * Splits a page at its `#`, `##` and `###` headings, ignoring `#` lines inside code blocks.
 * A level-one heading is the page title: it is returned as `pageTitle`, not as a section.
 */
export function splitSections(markdown: string): {
  pageTitle: string | null;
  sections: MarkdownSection[];
} {
  const anchors = new HeadingAnchors();
  const drafts: SectionDraft[] = [{ heading: null, anchor: null, lines: [] }];
  let pageTitle: string | null = null;
  let inCode = false;
  for (const line of markdown.split('\n')) {
    if (FENCE.test(line)) inCode = !inCode;
    const heading = headingOf(line, inCode);
    if (heading?.level === PAGE_TITLE_LEVEL && pageTitle === null) {
      pageTitle = heading.text;
    } else if (heading) {
      drafts.push({ heading: heading.text, anchor: anchors.anchor(heading.text), lines: [] });
    } else {
      drafts[drafts.length - 1].lines.push(line);
    }
  }
  return { pageTitle, sections: drafts.map(toSection).filter((section) => section.text) };
}
