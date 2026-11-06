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

/** A new state, and the nonce in it that the API also gives the browser as a cookie. */
export interface IssuedOAuthState {
  state: string;
  nonce: string;
  /** The PKCE verifier derived from the nonce, for channels that require PKCE. */
  codeVerifier: string;
}

/** The browser that followed the channel's redirect back to the API. */
export interface OAuthCallbackBrowser {
  /** The signed-in user, when the session cookie came along. */
  sessionUserId: string | null;
  /** The nonce cookie set when the connection started, when it came along. */
  nonce: string | null;
}
