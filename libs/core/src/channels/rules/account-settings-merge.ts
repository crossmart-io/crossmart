import type { Prisma } from '@crossmart/database';

function isJsonObject(value: unknown): value is Prisma.JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The account as the connector read it again on reconnect, plus what the merchant chose that
 * the connector never reads (an eBay connection's listing defaults): fields it read win, the
 * others are kept. An account of another channel, or no stored account, is replaced.
 */
export function mergeReconnectedAccount(
  stored: unknown,
  incoming: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | null {
  if (!isJsonObject(stored) || !isJsonObject(incoming)) return incoming ?? null;
  return stored.channel === incoming.channel ? { ...stored, ...incoming } : incoming;
}
