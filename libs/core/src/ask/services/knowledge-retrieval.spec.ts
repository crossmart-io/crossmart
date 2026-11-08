import { toFeatureGrants } from '../../entitlements/rules/feature-grants.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { PlanCatalogService } from '../../entitlements/services/plan-catalog.service.js';
import { ASK_RETRIEVED_CHUNKS, PLANS_CHUNK_ID, PUBLIC_CITATION_HOSTS } from '../ask.constants.js';
import { DOCS_KNOWLEDGE_CHUNKS } from '../knowledge/docs-knowledge.generated.js';
import { DocsKnowledgeSource } from '../sources/docs-knowledge.source.js';
import { PlanKnowledgeSource } from '../sources/plan-knowledge.source.js';
import { KnowledgeBaseService } from './knowledge-base.service.js';

/**
 * Regression tests on the committed knowledge index: representative questions must retrieve
 * the pages that answer them. A docs change that breaks one of these needs a look before the
 * index is committed.
 */

const OFFERED_PLAN = {
  code: 'starter',
  name: 'Starter',
  version: 1,
  grants: toFeatureGrants([
    { feature: Feature.ActiveListings, enabled: true, limit: 1000 },
    { feature: Feature.ChannelConnections, enabled: true, limit: 3 },
  ]),
};

const CHANNELS_URL = 'https://crossmart.io/#channels';
const FAQ_URL = 'https://crossmart.io/#faq';
const DOCS_CHANNELS_URL = 'https://docs.crossmart.io/channels/';
const SHOPIFY_PAGE_URL = 'https://docs.crossmart.io/channels/shopify/';
const CONNECT_STORE_URL = 'https://docs.crossmart.io/sellers/connect-a-store/';
const MCP_URL = 'https://docs.crossmart.io/developers/mcp/';
const AGENTS_URL = 'https://docs.crossmart.io/agents/';
const CLAUDE_CODE_URL = 'https://docs.crossmart.io/agents/claude-code/';
const API_KEYS_URL = 'https://docs.crossmart.io/developers/#api-keys';
const EBAY_FAILURES_URL = 'https://docs.crossmart.io/channels/ebay/#why-an-ebay-listing-fails';
const LISTING_FAILS_URL = 'https://docs.crossmart.io/sellers/listing-states/#when-a-listing-fails';
const STOCK_URL = 'https://docs.crossmart.io/sellers/stock/';
/** Pages that list the channels and their status: the site's list, its FAQ, the docs' overview. */
const CHANNEL_OVERVIEW_URLS = [CHANNELS_URL, FAQ_URL, DOCS_CHANNELS_URL];
const TOP_SOURCES = 3;

function knowledgeBase(): KnowledgeBaseService {
  const catalog = { listOffered: vi.fn().mockResolvedValue([OFFERED_PLAN]) };
  return new KnowledgeBaseService([
    new DocsKnowledgeSource(),
    new PlanKnowledgeSource(catalog as unknown as PlanCatalogService),
  ]);
}

async function topSources(question: string, count = TOP_SOURCES) {
  const found = await knowledgeBase().search(question, ASK_RETRIEVED_CHUNKS);
  return found.slice(0, count).map(({ chunk }) => chunk);
}

describe('knowledge index', () => {
  it('cites only public pages on the allowed hosts', () => {
    for (const chunk of DOCS_KNOWLEDGE_CHUNKS) {
      expect(PUBLIC_CITATION_HOSTS).toContain(new URL(chunk.url).hostname);
      expect(new URL(chunk.url).protocol).toBe('https:');
    }
  });

  it('includes the channel overview', () => {
    expect(DOCS_KNOWLEDGE_CHUNKS.map((chunk) => chunk.url)).toContain(CHANNELS_URL);
  });

  it('has unique chunk ids', () => {
    const ids = DOCS_KNOWLEDGE_CHUNKS.map((chunk) => chunk.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('retrieval for representative questions', () => {
  it.each([
    'Which marketplaces does Crossmart support?',
    'What channels can I sell on?',
    'Which platforms do you integrate with?',
  ])('answers "%s" from a channel overview', async (question) => {
    const [first] = await topSources(question);

    expect(CHANNEL_OVERVIEW_URLS).toContain(first.url);
  });

  it('answers pricing questions from the plans and the pricing FAQ', async () => {
    const [first, second] = await topSources('What pricing plans are there?');

    expect(first.id).toBe(PLANS_CHUNK_ID);
    expect(second.url).toBe(FAQ_URL);
  });

  it('answers how to connect Shopify from the Shopify page and the store connection guide', async () => {
    const urls = (await topSources('How do I connect my Shopify store?')).map((chunk) => chunk.url);

    expect(urls[0].startsWith(SHOPIFY_PAGE_URL)).toBe(true);
    expect(urls.some((url) => url.startsWith(CONNECT_STORE_URL))).toBe(true);
  });

  it('answers MCP setup from the MCP page and the agent guide', async () => {
    const sources = await topSources('How do I set up the MCP server?', 2);

    expect(sources.map((chunk) => chunk.url).sort()).toEqual([AGENTS_URL, MCP_URL].sort());
  });

  it("answers agent setup from that agent's guide", async () => {
    const [first] = await topSources('How do I connect Claude Code?');

    expect(first.url.startsWith(CLAUDE_CODE_URL)).toBe(true);
  });

  it('answers listing failures from the channel and the listing states', async () => {
    const urls = (await topSources('Why did my eBay listing fail?')).map((chunk) => chunk.url);

    expect(urls[0]).toBe(EBAY_FAILURES_URL);
    expect(urls).toContain(LISTING_FAILS_URL);
  });

  it('answers stock questions from the stock sync guide', async () => {
    const [first] = await topSources('How does stock sync work?');

    expect(first.url).toBe(STOCK_URL);
  });

  it('answers API key questions from the API keys section', async () => {
    const [first] = await topSources('How do I create an API key?');

    expect(first.url).toBe(API_KEYS_URL);
  });

  it('answers "What is Crossmart?" from the overview, not from a detail', async () => {
    const sources = await topSources('What is Crossmart?', 2);

    expect(sources.map((chunk) => chunk.title)).toContain('Crossmart FAQ › What is Crossmart?');
  });
});
