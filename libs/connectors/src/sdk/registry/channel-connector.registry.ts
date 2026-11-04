import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ChannelConnector } from '../channel-connector.interface.js';
import type { ChannelType } from '../channel-type.enum.js';
import { CHANNEL_CONNECTORS } from './connectors.constants.js';

/**
 * Every connector this instance ships, by channel. Core services look connectors up here
 * instead of importing them, so adding a channel never touches the orchestration code.
 */
@Injectable()
export class ChannelConnectorRegistry {
  private readonly connectors: ReadonlyMap<ChannelType, ChannelConnector>;

  constructor(@Inject(CHANNEL_CONNECTORS) connectors: readonly ChannelConnector[]) {
    this.connectors = new Map(connectors.map((connector) => [connector.channel, connector]));
    if (this.connectors.size !== connectors.length) {
      throw new Error('Two connectors are registered for the same channel');
    }
  }

  find(channel: ChannelType): ChannelConnector | undefined {
    return this.connectors.get(channel);
  }

  /** The connector of `channel`; 404 when this instance has none. */
  require(channel: ChannelType): ChannelConnector {
    const connector = this.find(channel);
    if (!connector) {
      throw new NotFoundException(`No connector for ${channel}`);
    }
    return connector;
  }

  list(): ChannelConnector[] {
    return [...this.connectors.values()];
  }
}
