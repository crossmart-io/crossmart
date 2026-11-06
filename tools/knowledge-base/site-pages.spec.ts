import { KnowledgeSourceKind } from '../../libs/core/src/ask/enums/knowledge-source-kind.enum.js';
import { SITE_SECTIONS } from './knowledge-base.constants.js';
import { pageChunks } from './page-chunks.js';
import { sectionsByHeading, sitePages } from './site-pages.js';

const FAQ_ANSWER =
  'The first connectors being built are Shopify and eBay. Google Shopping and Etsy come next, ' +
  'then Amazon. Every paid plan includes every channel.';

const LLMS_TXT = `# Crossmart

> The open-source multichannel platform.

## Pages

- [Pricing](https://crossmart.io/#pricing): plans

## Integrations

- Shopify: Building
- eBay: Building

## Cloud or self-hosted

- Price: Cloud: from $29 a month. Self-hosted: Free.

## Questions and answers

### Which marketplaces does Crossmart support?

${FAQ_ANSWER}

### Can I self-host Crossmart?

Yes. The code is licensed under AGPL-3.0 and runs with Docker Compose. Self-hosting is free, and you register your own marketplace developer apps.

## Contact

- Email: hello@crossmart.io
`;

describe('crossmart.io pages', () => {
  it('reads the text under each ## heading', () => {
    const sections = sectionsByHeading(LLMS_TXT);

    expect([...sections.keys()]).toEqual([
      'Pages',
      'Integrations',
      'Cloud or self-hosted',
      'Questions and answers',
      'Contact',
    ]);
    expect(sections.get('Integrations')).toBe('- Shopify: Building\n- eBay: Building');
  });

  it('keeps the listed sections, each cited by its place on the home page', () => {
    const pages = sitePages(LLMS_TXT);

    expect(pages.map((page) => page.url)).toEqual(
      SITE_SECTIONS.map((section) => `https://crossmart.io/#${section.anchor}`),
    );
    expect(pages.every((page) => page.source === KnowledgeSourceKind.Site)).toBe(true);
  });

  it('chunks the FAQ by question, citing the FAQ section, never a missing anchor', () => {
    const faq = sitePages(LLMS_TXT).find((page) => page.url.endsWith('#faq'));
    const chunks = faq ? pageChunks(faq) : [];

    expect(chunks.map((chunk) => chunk.title)).toEqual([
      'Crossmart FAQ › Which marketplaces does Crossmart support?',
      'Crossmart FAQ › Can I self-host Crossmart?',
    ]);
    expect(chunks.every((chunk) => chunk.url === 'https://crossmart.io/#faq')).toBe(true);
    expect(chunks[0].text).toBe(FAQ_ANSWER);
    expect(new Set(chunks.map((chunk) => chunk.id)).size).toBe(chunks.length);
  });

  it('fails when a listed section is gone, so a renamed section is noticed', () => {
    expect(() => sitePages(LLMS_TXT.replace('## Integrations', '## Channels'))).toThrow(
      /Integrations/,
    );
  });
});
