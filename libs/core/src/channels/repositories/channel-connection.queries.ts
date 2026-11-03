import type { ChannelConnection, Prisma } from '@crossmart/database';

/** Every read that is not about credentials leaves the sealed column out. */
export const WITHOUT_CREDENTIALS = {
  credentials: true,
} as const satisfies Prisma.ChannelConnectionOmit;

export type ChannelConnectionRecord = Omit<ChannelConnection, 'credentials'>;

/** The sealed credentials of one connection, with what identifies their scope. */
export interface SealedCredentialsRecord {
  id: string;
  workspaceId: string;
  channel: string;
  externalAccountId: string;
  credentials: string | null;
}

export const SEALED_CREDENTIALS_SELECT = {
  id: true,
  workspaceId: true,
  channel: true,
  externalAccountId: true,
  credentials: true,
} as const satisfies Prisma.ChannelConnectionSelect;

/** A connection as it is stored after the merchant approved the app. */
export interface ConnectedAccountRecord {
  workspaceId: string;
  channel: string;
  externalAccountId: string;
  displayName: string;
  sealedCredentials: string;
  credentialsExpiresAt: Date | null;
  grantedScopes: string[];
  settings: Prisma.InputJsonObject;
  connectedById: string;
  connectedAt: Date;
}

/** What wiping a connection's credentials writes. Settings stay so history reads well. */
export function wipedCredentials(now: Date): Prisma.ChannelConnectionUpdateManyMutationInput {
  return { credentials: null, credentialsExpiresAt: null, disconnectedAt: now };
}
