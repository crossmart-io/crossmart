import { NotFoundException } from '@nestjs/common';
import { ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import { productDetail } from '../../listings/testing/listing.fixtures.js';
import {
  CONNECTION_ID,
  CONTENT_JOB,
  contentRulesOf,
  contentRulesResolver,
} from '../testing/content-target.fixtures.js';
import { ContentTargetLoader } from './content-target.loader.js';

function setup(channel = ChannelType.Ebay) {
  const connections = {
    get: vi.fn<ChannelConnectionsService['get']>().mockResolvedValue({
      id: CONNECTION_ID,
      channel,
      displayName: 'eBay US',
    } as ChannelConnectionView),
  };
  const content = {
    read: vi.fn<ListingContentReader['read']>().mockResolvedValue({
      product: productDetail(),
      content: { title: 'Mug (eBay)', descriptionHtml: '<p>Stoneware.</p>' },
    }),
  };
  const loader = new ContentTargetLoader(
    connections as unknown as ChannelConnectionsService,
    content as unknown as ListingContentReader,
    contentRulesResolver(),
  );
  return { loader, connections, content };
}

describe('ContentTargetLoader', () => {
  it('loads the store’s rules, the product and what its listing shows', async () => {
    const { loader } = setup();

    expect(await loader.load(CONTENT_JOB)).toMatchObject({
      store: { id: CONNECTION_ID, displayName: 'eBay US' },
      rules: contentRulesOf(ChannelType.Ebay),
      current: { title: 'Mug (eBay)' },
    });
  });

  it('is null once the store or product is gone, or for a channel without rules', async () => {
    const gone = setup();
    gone.connections.get.mockRejectedValue(new NotFoundException());
    expect(await gone.loader.load(CONTENT_JOB)).toBeNull();

    const deleted = setup();
    deleted.content.read.mockResolvedValue(null);
    expect(await deleted.loader.load(CONTENT_JOB)).toBeNull();

    expect(await setup(ChannelType.Amazon).loader.load(CONTENT_JOB)).toBeNull();
  });
});
