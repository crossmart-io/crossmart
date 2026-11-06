import { LexicalIndex } from './lexical-index.js';
import { searchTerms } from './search-terms.js';

const DOCUMENTS = [
  { id: 'limits', searchText: 'Rate limits. Past a limit the API answers 429 Too Many Requests.' },
  {
    id: 'keys',
    searchText: 'API keys. Create an API key under Settings and send it in x-api-key.',
  },
  { id: 'ebay', searchText: 'eBay listings. Publishing a product to eBay creates a listing.' },
  { id: 'filler', searchText: 'Crossmart keeps one catalog for every store.' },
];

describe('searchTerms', () => {
  it('lowercases, drops stopwords and folds plurals', () => {
    expect(searchTerms('How do I publish my Listings to the docs?')).toEqual([
      'publish',
      'listing',
      'doc',
    ]);
  });

  it('folds synonyms, so marketplaces, stores and channels match', () => {
    expect(searchTerms('Marketplaces, stores, platforms and integrations')).toEqual([
      'channel',
      'channel',
      'channel',
      'channel',
    ]);
    expect(searchTerms('pricing cost tiers connected')).toEqual([
      'price',
      'price',
      'plan',
      'connect',
    ]);
  });

  it('leaves short words and words ending in "ss" alone', () => {
    expect(searchTerms('Ads, access, class and keys')).toEqual(['ads', 'access', 'class', 'key']);
  });
});

describe('LexicalIndex', () => {
  const index = new LexicalIndex(DOCUMENTS);

  it('ranks the section that shares the question’s rare words first', () => {
    const [best] = index.search('What happens when I hit the rate limit?', 3, 0.1);

    expect(best.document.id).toBe('limits');
  });

  it('matches plural and singular forms', () => {
    expect(index.search('ebay listing', 1, 0.1)[0].document.id).toBe('ebay');
  });

  it('returns nothing below the minimum score, or for a question of stopwords only', () => {
    expect(index.search('quantum chromodynamics', 3, 0.1)).toEqual([]);
    expect(index.search('what is it?', 3, 0)).toEqual([]);
  });

  it('honours the limit and orders by score', () => {
    const results = index.search('api key limit', 2, 0);

    expect(results).toHaveLength(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });
});
