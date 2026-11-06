import { ASK_KNOWLEDGE_REFRESH_MS } from '../ask.constants.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { KnowledgeSource } from '../sources/knowledge-source.js';
import { FixedKnowledgeSource } from '../testing/ask.fakes.js';
import { KnowledgeBaseService } from './knowledge-base.service.js';

const chunk = (id: string, title: string, text: string) => ({
  id,
  source: KnowledgeSourceKind.Docs,
  title,
  url: `https://docs.example/${id}`,
  text,
});

/** Unrelated sections, so the words that matter are rare, as in the real docs. */
const FILLER = ['Catalog', 'Inventory', 'Orders', 'Members', 'Roles', 'Exports'].map((title) =>
  chunk(title.toLowerCase(), title, `${title} in a workspace.`),
);

class FailingSource extends KnowledgeSource {
  chunks(): Promise<never> {
    return Promise.reject(new Error('database unreachable'));
  }
}

describe('KnowledgeBaseService', () => {
  it('searches every source and skips one that fails', async () => {
    const knowledge = new KnowledgeBaseService([
      new FixedKnowledgeSource([chunk('ebay', 'eBay', 'Publish listings to eBay.'), ...FILLER]),
      new FailingSource(),
    ]);

    const [found] = await knowledge.search('ebay listing', 3, 0);

    expect(found.chunk.id).toBe('ebay');
  });

  it('weighs a section’s title above its text', async () => {
    const knowledge = new KnowledgeBaseService([
      new FixedKnowledgeSource([
        chunk('mention', 'Orders', 'Orders also arrive from webhooks and from other places.'),
        chunk('titled', 'Webhooks', 'How Crossmart verifies what it receives from stores.'),
        ...FILLER,
      ]),
    ]);

    const [found] = await knowledge.search('webhooks', 2, 0);

    expect(found.chunk.id).toBe('titled');
  });

  it('rebuilds the index once it is older than the refresh interval', async () => {
    const source = new FixedKnowledgeSource([chunk('a', 'Etsy', 'Connect Etsy shops.')]);
    const spy = vi.spyOn(source, 'chunks');
    const knowledge = new KnowledgeBaseService([source]);

    await knowledge.search('etsy', 1, 0);
    await knowledge.search('etsy', 1, ASK_KNOWLEDGE_REFRESH_MS - 1);
    await knowledge.search('etsy', 1, ASK_KNOWLEDGE_REFRESH_MS);

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
