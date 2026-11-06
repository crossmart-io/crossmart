import { OVERVIEW_BOOST } from '../ask.constants.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { chunkHeading, chunkRelevance } from './chunk-relevance.js';
import { searchTerms } from './search-terms.js';

const chunk = (title: string, url: string) => ({
  id: url,
  source: KnowledgeSourceKind.Docs,
  title,
  url,
  text: 'Text.',
});

const terms = (question: string) => new Set(searchTerms(question));

describe('chunkRelevance', () => {
  it('reads the section heading from a "Page › Section" title', () => {
    expect(chunkHeading('Crossmart FAQ › Can I self-host Crossmart?')).toBe(
      'Can I self-host Crossmart?',
    );
    expect(chunkHeading('Crossmart for developers')).toBe('Crossmart for developers');
  });

  it('adds more for a heading that matches the question closely', () => {
    const question = terms('Which marketplaces does Crossmart support?');
    const exact = chunkRelevance(
      question,
      chunk('FAQ › Which marketplaces does Crossmart support?', 'https://docs.example/a'),
      1,
    );
    const partial = chunkRelevance(
      question,
      chunk('Quickstart › List your stores', 'https://docs.example/b'),
      1,
    );

    expect(exact).toBeGreaterThan(partial);
    expect(partial).toBeGreaterThan(1);
  });

  it('boosts overview pages', () => {
    const question = terms('payments');

    expect(chunkRelevance(question, chunk('Intro', 'https://crossmart.io/#channels'), 2)).toBe(
      2 * OVERVIEW_BOOST,
    );
    expect(chunkRelevance(question, chunk('Intro', 'https://docs.example/'), 2)).toBe(2);
  });
});
