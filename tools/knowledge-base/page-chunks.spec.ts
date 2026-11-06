import { KnowledgeSourceKind } from '../../libs/core/src/ask/enums/knowledge-source-kind.enum.js';
import { HeadingAnchors } from './heading-anchor.js';
import { MAX_CHUNK_LENGTH } from './knowledge-base.constants.js';
import { splitSections } from './markdown-sections.js';
import { toPlainMarkdown } from './markdown-text.js';
import { pageChunks } from './page-chunks.js';
import { docsPageUrl } from './page-collector.js';
import { splitText } from './text-pieces.js';

const MDX_PAGE = `---
title: Crossmart for developers
description: The REST API and its limits.
---

import { Aside, LinkCard } from '@astrojs/starlight/components';

Everything goes through a [public REST API](/developers/api/).

<LinkCard title="Quickstart" href="/developers/quickstart/" description="From product to order." />

## Rate limits

<Aside type="caution">Most endpoints have no limit today, and two AI endpoints are limited per workspace and per caller because each call spends AI credits.</Aside>

\`\`\`bash
# not a heading
curl https://api.crossmart.io/api/v1/api-key
\`\`\`

## Rate limits

Repeated heading with enough text to stand as its own section in the knowledge index: sign-in and sign-up under /api/auth are limited too.
`;

describe('knowledge base build', () => {
  it('writes anchors as GitHub and Starlight do, numbering repeats', () => {
    const anchors = new HeadingAnchors();

    expect(anchors.anchor('Check the `listing` status!')).toBe('check-the-listing-status');
    expect(anchors.anchor('Rate limits')).toBe('rate-limits');
    expect(anchors.anchor('Rate limits')).toBe('rate-limits-1');
  });

  it('turns MDX into text: no imports or components, link cards and link texts kept', () => {
    const text = toPlainMarkdown(MDX_PAGE);

    expect(text).not.toContain('import ');
    expect(text).not.toContain('<Aside');
    expect(text).not.toContain('](/developers');
    expect(text).toContain('public REST API');
    expect(text).toContain('- Quickstart: From product to order.');
  });

  it('splits at headings but not at # lines inside code', () => {
    const { pageTitle, sections } = splitSections(
      '# Title\n\nIntro\n\n## A\n\n```\n# code\n```\n\n### B\n\nb',
    );

    expect(pageTitle).toBe('Title');
    expect(sections.map((section) => section.heading)).toEqual([null, 'A', 'B']);
    expect(sections[1].text).toContain('# code');
  });

  it('cuts long text between paragraphs, and between lines when a paragraph is too long', () => {
    const paragraph = 'word '.repeat(50).trim();
    const pieces = splitText([paragraph, paragraph, paragraph].join('\n\n'), 520);

    expect(pieces).toHaveLength(2);
    expect(
      splitText(Array.from({ length: 30 }, () => '| a | b |').join('\n'), 50).length,
    ).toBeGreaterThan(1);
    expect(splitText('x'.repeat(10)).every((piece) => piece.length <= MAX_CHUNK_LENGTH)).toBe(true);
  });

  it('chunks a docs page by section with public URLs and titles', () => {
    const chunks = pageChunks({
      source: KnowledgeSourceKind.Docs,
      path: 'developers/index.mdx',
      url: 'https://docs.crossmart.io/developers/',
      linksSections: true,
      fallbackTitle: 'index',
      content: MDX_PAGE,
    });

    expect(chunks.map((chunk) => [chunk.title, chunk.url])).toEqual([
      ['Crossmart for developers', 'https://docs.crossmart.io/developers/'],
      [
        'Crossmart for developers › Rate limits',
        'https://docs.crossmart.io/developers/#rate-limits',
      ],
      [
        'Crossmart for developers › Rate limits',
        'https://docs.crossmart.io/developers/#rate-limits-1',
      ],
    ]);
    expect(chunks[0].text.startsWith('The REST API and its limits.')).toBe(true);
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
  });

  it('maps files to their public URLs', () => {
    expect(docsPageUrl('index.mdx')).toBe('https://docs.crossmart.io/');
    expect(docsPageUrl('developers/sdks/python.mdx')).toBe(
      'https://docs.crossmart.io/developers/sdks/python/',
    );
  });
});
