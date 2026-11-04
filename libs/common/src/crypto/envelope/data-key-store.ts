/** A workspace's data key, encrypted with a master key. Never stored in plain text. */
export interface WrappedDataKey {
  wrappedKey: string;
  masterKeyVersion: number;
}

/**
 * Where wrapped data keys live, one per workspace. Implemented over the database in
 * `@crossmart/core`; an in-memory store backs the unit tests.
 */
export abstract class DataKeyStore {
  abstract find(workspaceId: string): Promise<WrappedDataKey | null>;

  /** Stores `key` unless the workspace already has one, and returns the key that won. */
  abstract insertIfAbsent(workspaceId: string, key: WrappedDataKey): Promise<WrappedDataKey>;

  /** Replaces the workspace's key after a master key rotation. */
  abstract replace(workspaceId: string, key: WrappedDataKey): Promise<void>;
}
