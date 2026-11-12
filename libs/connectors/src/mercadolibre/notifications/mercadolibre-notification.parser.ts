import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  type ChannelWebhookEvent,
  ChannelWebhookKind,
  type IncomingWebhook,
} from '../../sdk/capabilities/webhook-receiver.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import {
  MERCADOLIBRE_NUMERIC_ID_PATTERN,
  MERCADOLIBRE_ORDER_RESOURCE_PATTERN,
} from '../mercadolibre.constants.js';
import { MercadoLibreTopic } from '../mercadolibre.enums.js';
import { MercadoLibreApp } from '../mercadolibre-app.js';

const BODY_ENCODING = 'utf8';
/** Ids are numbers in most of the guide's examples and strings in some. */
const numericId = z
  .union([z.number().int(), z.string().regex(MERCADOLIBRE_NUMERIC_ID_PATTERN)])
  .transform(String);

/** A notification as the Receive notifications guide shows it. */
const notificationSchema = z.object({
  _id: z.string().min(1),
  resource: z.string(),
  user_id: numericId,
  topic: z.string(),
  application_id: numericId,
});

type Notification = z.infer<typeof notificationSchema>;

/** The order an `orders_v2` notification is about, from `resource` (`/orders/{id}`). */
function orderIdOf(notification: Notification): string | undefined {
  if (notification.topic !== MercadoLibreTopic.Orders) return undefined;
  return MERCADOLIBRE_ORDER_RESOURCE_PATTERN.exec(notification.resource)?.[1];
}

/**
 * Reads Mercado Libre notifications. They carry no signature: a notification is accepted only
 * when it is for this instance's app, and it is a hint, never data. An `orders_v2` one makes
 * Crossmart read the order with the seller's own token, which only works for an order of that
 * seller; every other topic is acknowledged and ignored.
 */
@Injectable()
export class MercadoLibreNotificationParser {
  constructor(private readonly app: MercadoLibreApp) {}

  parse(webhook: IncomingWebhook): ChannelWebhookEvent | null {
    const parsed = notificationSchema.safeParse(
      parseJsonBody(webhook.rawBody.toString(BODY_ENCODING)),
    );
    if (!parsed.success || parsed.data.application_id !== this.app.appId) return null;
    const notification = parsed.data;
    const orderId = orderIdOf(notification);
    return {
      kind: orderId ? ChannelWebhookKind.OrderChanged : ChannelWebhookKind.Unhandled,
      topic: notification.topic,
      externalAccountId: notification.user_id,
      deliveryId: notification._id,
      payload: notification,
      ...(orderId ? { resourceId: orderId } : {}),
    };
  }
}
