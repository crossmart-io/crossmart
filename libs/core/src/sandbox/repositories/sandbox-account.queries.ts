import type { Prisma } from '@crossmart/database';
import { CREDENTIAL_PROVIDER_ID } from '../sandbox.constants.js';

/** A sandbox whose link still works: the token matches, unclaimed and unexpired. */
export function claimableWhere(claimTokenHash: string, now: Date): Prisma.SandboxAccountWhereInput {
  return { claimTokenHash, claimedAt: null, expiresAt: { gt: now } };
}

/** What the claim flow reads of a sandbox: its parts and how the person is known. */
export const SANDBOX_PREVIEW_SELECT = {
  id: true,
  workspaceId: true,
  userId: true,
  expiresAt: true,
  user: { select: { email: true } },
  organization: { select: { name: true } },
} as const satisfies Prisma.SandboxAccountSelect;

/** True when the person can already sign in with a password. */
export async function hasPassword(
  client: Pick<Prisma.TransactionClient, 'account'>,
  userId: string,
): Promise<boolean> {
  const count = await client.account.count({
    where: { userId, providerId: CREDENTIAL_PROVIDER_ID, password: { not: null } },
  });
  return count > 0;
}
