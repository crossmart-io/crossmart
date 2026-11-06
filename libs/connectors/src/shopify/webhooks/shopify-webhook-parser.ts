import { z } from 'zod';
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
import {
  SHOP_BOUND_TOPICS,
  SHOPIFY_TRIGGERED_AT_HEADER,
  SHOPIFY_WEBHOOK_CLOCK_SKEW_MS,
  SHOPIFY_WEBHOOK_MAX_AGE_MS,
} from './shopify-webhook.constants.js';

const TOPIC_KINDS: Readonly<Record<string, ChannelWebhookKind>> = {
  [ShopifyWebhookTopic.AppUninstalled]: ChannelWebhookKind.AccountDisconnected,
  [ShopifyWebhookTopic.OrdersCreate]: ChannelWebhookKind.OrderChanged,
  [ShopifyWebhookTopic.OrdersUpdated]: ChannelWebhookKind.OrderChanged,
  [ShopifyWebhookTopic.OrdersCancelled]: ChannelWebhookKind.OrderChanged,
  [ShopifyWebhookTopic.CustomersDataRequest]: ChannelWebhookKind.CustomerDataRequested,
  [ShopifyWebhookTopic.CustomersRedact]: ChannelWebhookKind.CustomerRedactionRequested,
  [ShopifyWebhookTopic.ShopRedact]: ChannelWebhookKind.AccountRedactionRequested,
};

interface DeliveryHeaders {
  topic: string;
  shopDomain: string;
}

/** Resource webhooks (orders, products) name their subject by its Admin GraphQL id. */
const resourceIdSchema = z.object({ admin_graphql_api_id: z.string() });

/**
 * How a body names its store: privacy topics by `shop_domain`, `app/uninstalled` (a Shop) by
 * `myshopify_domain`. Its `domain` is the store's primary domain, which may be a custom one.
 */
const bodyShopSchema = z.union([
  z.object({ shop_domain: z.string() }).transform((body) => body.shop_domain),
  z.object({ myshopify_domain: z.string() }).transform((body) => body.myshopify_domain),
]);

/**
 * Verifies a delivery's HMAC over the raw body before reading anything else, refuses stale
 * deliveries and store-wide topics whose body names another shop than the header, then maps
 * its topic to a channel-neutral kind. Core deduplicates deliveries by their id.
 */
@Injectable()
export class ShopifyWebhookParser {
  constructor(private readonly signatures: ShopifySignatures) {}

  parse(webhook: IncomingWebhook, now = Date.now()): ChannelWebhookEvent | null {
    const { headers, rawBody } = webhook;
    if (!this.signatures.verifyBody(rawBody, headers[ShopifyWebhookHeader.Hmac])) {
      return null;
    }
    const delivery = ShopifyWebhookParser.readHeaders(headers, now);
    if (!delivery) return null;
    const payload = parseJsonBody(rawBody.toString());
    const { topic, shopDomain } = delivery;
    if (SHOP_BOUND_TOPICS.has(topic) && !ShopifyWebhookParser.namesShop(payload, shopDomain)) {
      return null;
    }
    return {
      kind: TOPIC_KINDS[topic] ?? ChannelWebhookKind.Unhandled,
      topic,
      externalAccountId: shopDomain,
      deliveryId: headers[ShopifyWebhookHeader.WebhookId] ?? null,
      payload,
      resourceId: resourceIdSchema.safeParse(payload).data?.admin_graphql_api_id,
    };
  }

  /** The topic and shop of a fresh delivery; null when either is missing or it is stale. */
  private static readHeaders(
    headers: IncomingWebhook['headers'],
    now: number,
  ): DeliveryHeaders | null {
    const topic = headers[ShopifyWebhookHeader.Topic];
    const shopDomain = headers[ShopifyWebhookHeader.ShopDomain]?.toLowerCase();
    if (!topic || !shopDomain || !isShopDomain(shopDomain)) return null;
    if (!ShopifyWebhookParser.isFresh(headers[SHOPIFY_TRIGGERED_AT_HEADER], now)) return null;
    return { topic, shopDomain };
  }

  /** Triggered within the replay window, and not implausibly far in the future. */
  private static isFresh(triggeredAt: string | undefined, now: number): boolean {
    const triggered = triggeredAt ? Date.parse(triggeredAt) : Number.NaN;
    if (Number.isNaN(triggered)) return false;
    const age = now - triggered;
    return age <= SHOPIFY_WEBHOOK_MAX_AGE_MS && age >= -SHOPIFY_WEBHOOK_CLOCK_SKEW_MS;
  }

  private static namesShop(payload: unknown, shopDomain: string): boolean {
    return bodyShopSchema.safeParse(payload).data?.toLowerCase() === shopDomain;
  }
}
