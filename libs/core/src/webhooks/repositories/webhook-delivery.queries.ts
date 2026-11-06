import type { Prisma } from '@crossmart/database';

/** A delivery with what sending it needs: its event and its endpoint's URL and secrets. */
export const DELIVERY_TO_SEND_INCLUDE = {
  event: true,
  endpoint: {
    select: {
      id: true,
      workspaceId: true,
      url: true,
      sealedSecret: true,
      previousSealedSecret: true,
      previousSecretExpiresAt: true,
      disabledReason: true,
    },
  },
} satisfies Prisma.WebhookDeliveryInclude;

export type DeliveryToSend = Prisma.WebhookDeliveryGetPayload<{
  include: typeof DELIVERY_TO_SEND_INCLUDE;
}>;

/** A delivery as the log lists it: with its event's type, not its body. */
export const DELIVERY_ROW_INCLUDE = {
  event: { select: { type: true } },
} satisfies Prisma.WebhookDeliveryInclude;

export type DeliveryRow = Prisma.WebhookDeliveryGetPayload<{
  include: typeof DELIVERY_ROW_INCLUDE;
}>;

/** A delivery with its whole event, to show the body it sends. */
export const DELIVERY_DETAIL_INCLUDE = { event: true } satisfies Prisma.WebhookDeliveryInclude;

export type DeliveryDetailRow = Prisma.WebhookDeliveryGetPayload<{
  include: typeof DELIVERY_DETAIL_INCLUDE;
}>;

/** The endpoint an attempt was for, to sign the request and count failures. */
export type DeliveryEndpoint = DeliveryToSend['endpoint'];
