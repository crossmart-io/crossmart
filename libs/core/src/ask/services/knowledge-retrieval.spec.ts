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
const DEVELOPERS_URL = 'https://docs.crossmart.io/developers/';
const MCP_URL = 'https://docs.crossmart.io/developers/mcp/';
const API_KEYS_URL = 'https://docs.crossmart.io/developers/#api-keys';
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
  ])('answers "%s" from the channel overview', async (question) => {
    const urls = (await topSources(question, 2)).map((chunk) => chunk.url);

    expect(urls).toContain(CHANNELS_URL);
    expect(urls.every((url) => url === CHANNELS_URL || url === FAQ_URL)).toBe(true);
  });

  it('answers pricing questions from the plans and the pricing FAQ', async () => {
    const [first, second] = await topSources('What pricing plans are there?');

    expect(first.id).toBe(PLANS_CHUNK_ID);
    expect(second.url).toBe(FAQ_URL);
  });

  it('answers how to connect Shopify from the channel list and the developer docs', async () => {
    const urls = (await topSources('How do I connect my Shopify store?')).map((chunk) => chunk.url);

    expect(urls).toContain(CHANNELS_URL);
    expect(urls).toContain(DEVELOPERS_URL);
  });

  it('answers MCP setup from the MCP page', async () => {
    const sources = await topSources('How do I set up the MCP server?', 2);

    expect(sources.every((chunk) => chunk.url.startsWith(MCP_URL))).toBe(true);
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
