import { ShopifyWebhookTopic } from '../shopify.constants.js';

/** When Shopify triggered the delivery (ISO 8601). Like every header, it is not signed. */
export const SHOPIFY_TRIGGERED_AT_HEADER = 'x-shopify-triggered-at';

/**
 * Deliveries triggered longer ago than this are refused as replays. Shopify retries a failed
 * delivery 8 times over 4 hours, so the window covers every retry; core remembers delivery ids
 * for longer than this.
 */
export const SHOPIFY_WEBHOOK_MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** Clocks drift: a delivery may claim to be this far in the future. */
export const SHOPIFY_WEBHOOK_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Topics that erase or disconnect a whole store. The body (which the HMAC covers) must name the
 * same shop as the unsigned `X-Shopify-Shop-Domain` header, so a signed body for one store can
 * never be replayed against another.
 */
export const SHOP_BOUND_TOPICS: ReadonlySet<string> = new Set([
  ShopifyWebhookTopic.AppUninstalled,
  ShopifyWebhookTopic.CustomersDataRequest,
  ShopifyWebhookTopic.CustomersRedact,
  ShopifyWebhookTopic.ShopRedact,
]);
