import type { Prisma } from '@crossmart/database';
import type { ConnectionSettingsKey } from '../enums/connection-settings-key.enum.js';

/** A client that can run raw statements: the Prisma service or a transaction. */
export type RawClient = Pick<Prisma.TransactionClient, '$executeRaw' | '$queryRaw'>;

/** The connection whose settings change, always within its workspace. */
export interface SettingsTarget {
  workspaceId: string;
  connectionId: string;
}

/**
 * Replaces one top-level key of the settings in a single statement, so a concurrent write of
 * another key is never lost. Returns the number of rows changed (0: not in this workspace).
 */
export function writeSettingsKey(
  client: RawClient,
  { workspaceId, connectionId }: SettingsTarget,
  key: ConnectionSettingsKey,
  value: unknown,
): Promise<number> {
  return client.$executeRaw`
    UPDATE channel_connections
    SET settings = jsonb_set(
          CASE WHEN jsonb_typeof(settings) = 'object' THEN settings ELSE '{}'::jsonb END,
          ARRAY[${key}::text],
          ${JSON.stringify(value ?? null)}::jsonb
        ),
        updated_at = now()
    WHERE id = ${connectionId}::uuid AND workspace_id = ${workspaceId}::uuid`;
}

/**
 * Locks the connection row for the transaction and returns the stored value of one key, or
 * undefined when the connection is not in this workspace.
 */
export async function lockSettingsKey(
  client: RawClient,
  { workspaceId, connectionId }: SettingsTarget,
  key: ConnectionSettingsKey,
): Promise<{ value: unknown } | undefined> {
  const [row] = await client.$queryRaw<{ value: unknown }[]>`
    SELECT settings -> ${key}::text AS value
    FROM channel_connections
    WHERE id = ${connectionId}::uuid AND workspace_id = ${workspaceId}::uuid
    FOR UPDATE`;
  return row;
}
