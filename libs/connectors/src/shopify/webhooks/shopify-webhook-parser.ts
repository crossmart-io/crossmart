import { Injectable } from '@nestjs/common';
import {
  ChannelWebhookKind,
  type ChannelWebhookEvent,
  type IncomingWebhook,
} from '../../sdk/capabilities/webhook-receiver.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { isShopDomain } from '../shop-domain.js';
import { ShopifyWebhookHeader, ShopifyWebhookTopic } from '../shopify.constants.js';
import { ShopifySignatures } from '../shopify-signatures.js';

const TOPIC_KINDS: Readonly<Record<string, ChannelWebhookKind>> = {
  [ShopifyWebhookTopic.AppUninstalled]: ChannelWebhookKind.AccountDisconnected,
  [ShopifyWebhookTopic.CustomersDataRequest]: ChannelWebhookKind.CustomerDataRequested,
  [ShopifyWebhookTopic.CustomersRedact]: ChannelWebhookKind.CustomerRedactionRequested,
  [ShopifyWebhookTopic.ShopRedact]: ChannelWebhookKind.AccountRedactionRequested,
};

/**
 * Verifies a delivery's HMAC over the raw body before reading anything else, then maps its
 * topic to a channel-neutral kind.
 */
@Injectable()
export class ShopifyWebhookParser {
  constructor(private readonly signatures: ShopifySignatures) {}

  parse(webhook: IncomingWebhook): ChannelWebhookEvent | null {
    const { headers, rawBody } = webhook;
    if (!this.signatures.verifyBody(rawBody, headers[ShopifyWebhookHeader.Hmac])) {
      return null;
    }
    const topic = headers[ShopifyWebhookHeader.Topic];
    const shopDomain = headers[ShopifyWebhookHeader.ShopDomain];
    if (!topic || !shopDomain || !isShopDomain(shopDomain)) {
      return null;
    }
    return {
      kind: TOPIC_KINDS[topic] ?? ChannelWebhookKind.Unhandled,
      topic,
      externalAccountId: shopDomain.toLowerCase(),
      deliveryId: headers[ShopifyWebhookHeader.WebhookId] ?? null,
      payload: parseJsonBody(rawBody.toString()),
    };
  }
}
