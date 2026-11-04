import { NotFoundException } from '@nestjs/common';
import { ChannelType } from '../channel-type.enum.js';
import type { ChannelConnector } from '../channel-connector.interface.js';
import { ChannelConnectorRegistry } from './channel-connector.registry.js';

function connector(channel: ChannelType): ChannelConnector {
  return { channel } as ChannelConnector;
}

describe('ChannelConnectorRegistry', () => {
  it('finds connectors by channel and lists them', () => {
    const shopify = connector(ChannelType.Shopify);
    const registry = new ChannelConnectorRegistry([shopify, connector(ChannelType.Ebay)]);

    expect(registry.require(ChannelType.Shopify)).toBe(shopify);
    expect(registry.find(ChannelType.Etsy)).toBeUndefined();
    expect(registry.list()).toHaveLength(2);
  });

  it('404s a channel without a connector', () => {
    const registry = new ChannelConnectorRegistry([]);

    expect(() => registry.require(ChannelType.Amazon)).toThrow(NotFoundException);
  });

  it('refuses two connectors for one channel', () => {
    expect(
      () =>
        new ChannelConnectorRegistry([
          connector(ChannelType.Shopify),
          connector(ChannelType.Shopify),
        ]),
    ).toThrow(/same channel/);
  });
});
