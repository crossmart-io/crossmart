import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ContentProductRepository } from '../repositories/content-product.repository.js';
import { CONNECTION_ID, PRODUCT_ID, WORKSPACE_ID } from '../testing/content-target.fixtures.js';
import { ContentRequestValidator } from './content-request.validator.js';

const REQUEST = {
  workspaceId: WORKSPACE_ID,
  connectionId: CONNECTION_ID,
  productIds: [PRODUCT_ID, PRODUCT_ID],
};

function setup(channel = ChannelType.Ebay) {
  const connections = {
    get: vi
      .fn<ChannelConnectionsService['get']>()
      .mockResolvedValue({ id: CONNECTION_ID, channel } as ChannelConnectionView),
  };
  const products = {
    findTitles: vi
      .fn<ContentProductRepository['findTitles']>()
      .mockResolvedValue([{ id: PRODUCT_ID, title: 'Mug' }]),
  };
  const validator = new ContentRequestValidator(
    connections as unknown as ChannelConnectionsService,
    products as unknown as ContentProductRepository,
  );
  return { validator, connections, products };
}

describe('ContentRequestValidator', () => {
  it('accepts the workspace’s own products, once each', async () => {
    const { validator, products } = setup();

    const validated = await validator.validate(REQUEST);

    expect(validated.products).toEqual([{ id: PRODUCT_ID, title: 'Mug' }]);
    expect(products.findTitles).toHaveBeenCalledWith(WORKSPACE_ID, [PRODUCT_ID]);
  });

  it('refuses products of another workspace', async () => {
    const { validator, products } = setup();
    products.findTitles.mockResolvedValue([]);

    await expect(validator.validate(REQUEST)).rejects.toThrow(BadRequestException);
  });

  it('refuses a channel without content rules', async () => {
    const { validator } = setup(ChannelType.Walmart);

    await expect(validator.validate(REQUEST)).rejects.toThrow(BadRequestException);
  });

  it('is not found for a store of another workspace', async () => {
    const { validator, connections } = setup();
    connections.get.mockRejectedValue(new NotFoundException());

    await expect(validator.validate(REQUEST)).rejects.toThrow(NotFoundException);
  });
});
