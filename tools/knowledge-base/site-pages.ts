import { KnowledgeSourceKind } from '../../libs/core/src/ask/enums/knowledge-source-kind.enum.js';
import {
  SITE_LLMS_URL,
  SITE_SECTIONS,
  SITE_URL,
  type SiteSection,
} from './knowledge-base.constants.js';
import type { KnowledgePage } from './page-chunks.js';

const SECTION_HEADING = /^##\s+(?<heading>.+?)\s*$/;
const LINE = '\n';
const ANCHOR_MARK = '#';
const URL_SEPARATOR = '/';
const PAGE_TITLE_MARK = '# ';

/** The text under each `##` heading of a Markdown file, by heading. */
export function sectionsByHeading(markdown: string): Map<string, string> {
  const sections = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of markdown.split(LINE)) {
    const heading = SECTION_HEADING.exec(line)?.groups?.heading;
    if (heading !== undefined) {
      current = [];
      sections.set(heading, current);
    } else {
      current?.push(line);
    }
  }
  return new Map([...sections].map(([heading, lines]) => [heading, lines.join(LINE).trim()]));
}

function toSitePage(section: SiteSection, body: string): KnowledgePage {
  return {
    source: KnowledgeSourceKind.Site,
    path: section.anchor,
    url: `${SITE_URL}${URL_SEPARATOR}${ANCHOR_MARK}${section.anchor}`,
    // The site's `###` headings (questions in the FAQ) are not anchors of their own.
    linksSections: false,
    fallbackTitle: section.title,
    content: `${PAGE_TITLE_MARK}${section.title}${LINE}${LINE}${body}`,
  };
}

/**
 * The sections of crossmart.io listed in `SITE_SECTIONS`, from its llms.txt, each cited by its
 * place on the home page. A listed section the file no longer has fails the build, so a renamed
 * section is noticed instead of silently dropped.
 */
export function sitePages(llmsText: string): KnowledgePage[] {
  const sections = sectionsByHeading(llmsText);
  return SITE_SECTIONS.map((section) => {
    const body = sections.get(section.heading);
    if (!body) throw new Error(`${SITE_LLMS_URL} has no "## ${section.heading}" section`);
    return toSitePage(section, body);
  });
}

/** crossmart.io's llms.txt, fetched when the knowledge index is built. */
export async function fetchSiteLlmsText(): Promise<string> {
  const response = await fetch(SITE_LLMS_URL);
  if (!response.ok) throw new Error(`${SITE_LLMS_URL} answered ${response.status}`);
  return response.text();
}
