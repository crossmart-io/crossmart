import { DataKeyStore, type WrappedDataKey } from './data-key-store.js';

/** Keeps wrapped data keys in memory, for tests and tools that run without a database. */
export class InMemoryDataKeyStore extends DataKeyStore {
  readonly keys = new Map<string, WrappedDataKey>();

  find(workspaceId: string): Promise<WrappedDataKey | null> {
    return Promise.resolve(this.keys.get(workspaceId) ?? null);
  }

  insertIfAbsent(workspaceId: string, key: WrappedDataKey): Promise<WrappedDataKey> {
    const existing = this.keys.get(workspaceId);
    if (existing) {
      return Promise.resolve(existing);
    }
    this.keys.set(workspaceId, key);
    return Promise.resolve(key);
  }

  replace(workspaceId: string, key: WrappedDataKey): Promise<void> {
    this.keys.set(workspaceId, key);
    return Promise.resolve();
  }
}
