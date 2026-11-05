import {
  type ChannelConnector,
  ChannelConnectorRegistry,
  ChannelType,
  DescriptionFormat,
  EBAY_CONTENT_LIMITS,
} from '@crossmart/connectors';
import { contentRulesResolver } from '../testing/content-target.fixtures.js';
import { ChannelContentRulesResolver } from './channel-content-rules.resolver.js';

describe('ChannelContentRulesResolver', () => {
  it('writes to the channel’s target length, under its hard limit', () => {
    const rules = contentRulesResolver().rulesFor(ChannelType.Ebay);

    expect(EBAY_CONTENT_LIMITS.descriptionMaxLength).toBe(500_000);
    expect(rules).toMatchObject({
      channelName: 'eBay',
      titleMaxLength: 80,
      descriptionMaxLength: 4_000,
      descriptionFormat: DescriptionFormat.BasicHtml,
      allowsLinks: false,
    });
  });

  it('takes Shopify’s and Google’s limits from their connectors', () => {
    const resolver = contentRulesResolver();

    expect(resolver.rulesFor(ChannelType.Shopify)).toMatchObject({
      titleMaxLength: 255,
      descriptionMaxLength: 5_000,
      allowsLinks: true,
    });
    expect(resolver.rulesFor(ChannelType.GoogleMerchant)).toMatchObject({
      titleMaxLength: 150,
      descriptionMaxLength: 5_000,
    });
  });

  it('has no rules without guidance, a connector, or declared limits', () => {
    const withoutLimits = new ChannelContentRulesResolver(
      new ChannelConnectorRegistry([{ channel: ChannelType.Ebay } as ChannelConnector]),
    );

    expect(withoutLimits.rulesFor(ChannelType.Ebay)).toBeNull();
    expect(withoutLimits.rulesFor(ChannelType.Shopify)).toBeNull();
    expect(contentRulesResolver().rulesFor(ChannelType.Amazon)).toBeNull();
  });
});
