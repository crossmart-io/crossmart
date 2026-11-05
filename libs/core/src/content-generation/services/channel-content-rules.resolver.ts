import { Injectable } from '@nestjs/common';
import { ChannelConnectorRegistry, type ChannelType } from '@crossmart/connectors';
import {
  CHANNEL_CONTENT_GUIDANCE,
  type ChannelContentRules,
  channelContentRules,
} from '../rules/channel-content-rules.js';

/** A channel's content rules: core's writing guidance and the limits its connector declares. */
@Injectable()
export class ChannelContentRulesResolver {
  constructor(private readonly registry: ChannelConnectorRegistry) {}

  /** Null when the channel has no guidance, no connector here, or no declared limits. */
  rulesFor(channel: ChannelType): ChannelContentRules | null {
    const guidance = CHANNEL_CONTENT_GUIDANCE[channel];
    const limits = this.registry.find(channel)?.contentLimits;
    return guidance && limits ? channelContentRules(guidance, limits) : null;
  }
}
