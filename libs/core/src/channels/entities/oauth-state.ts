import { z } from 'zod';
import { ChannelType } from '@crossmart/connectors';

/** What the signed OAuth `state` carries through the channel and back. */
export const oauthStatePayloadSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
  channel: z.enum(ChannelType),
  /** The normalized account handle the merchant started with; the connector checks it. */
  accountHandle: z.string().min(1),
  nonce: z.string().min(1),
  /** Milliseconds since the epoch. */
  expiresAt: z.number().int().positive(),
});

export type OAuthStatePayload = z.infer<typeof oauthStatePayloadSchema>;

export type OAuthStateClaims = Omit<OAuthStatePayload, 'nonce' | 'expiresAt'>;
