import { randomBytes } from 'node:crypto';
import { openAesGcm, sealAesGcm } from './aes-gcm.js';
import { DataKeyStore, type WrappedDataKey } from './data-key-store.js';
import { DATA_KEY_CONTEXT_PREFIX, KEY_BYTES } from './envelope.constants.js';
import { EnvelopeEncryption, type SecretScope } from './envelope-encryption.js';
import type { MasterKeyRing } from './master-key-ring.js';

/**
 * AES-256-GCM envelope encryption. Plain data keys only live in memory for one call, and
 * nothing here logs keys, plaintexts or sealed values.
 */
export class AesGcmEnvelopeEncryption extends EnvelopeEncryption {
  constructor(
    private readonly masterKeys: MasterKeyRing,
    private readonly dataKeys: DataKeyStore,
  ) {
    super();
  }

  get isConfigured(): boolean {
    return this.masterKeys.isConfigured;
  }

  async encrypt(scope: SecretScope, plaintext: string): Promise<string> {
    const dataKey = await this.loadOrCreateDataKey(scope.workspaceId);
    return sealAesGcm(dataKey, Buffer.from(plaintext), scope.context);
  }

  async decrypt(scope: SecretScope, sealed: string): Promise<string> {
    const wrapped = await this.dataKeys.find(scope.workspaceId);
    if (!wrapped) {
      throw new RangeError('The workspace has no data key');
    }
    const dataKey = this.unwrap(scope.workspaceId, wrapped);
    return openAesGcm(dataKey, sealed, scope.context).toString();
  }

  async rewrapDataKey(workspaceId: string): Promise<boolean> {
    const wrapped = await this.dataKeys.find(workspaceId);
    const current = this.masterKeys.current();
    if (!wrapped || wrapped.masterKeyVersion === current.version) {
      return false;
    }
    const dataKey = this.unwrap(workspaceId, wrapped);
    await this.dataKeys.replace(workspaceId, this.wrap(workspaceId, dataKey));
    return true;
  }

  private async loadOrCreateDataKey(workspaceId: string): Promise<Buffer> {
    const existing = await this.dataKeys.find(workspaceId);
    if (existing) {
      return this.unwrap(workspaceId, existing);
    }
    const created = this.wrap(workspaceId, randomBytes(KEY_BYTES));
    // A concurrent call may have created the key first: use whichever was stored.
    const stored = await this.dataKeys.insertIfAbsent(workspaceId, created);
    return this.unwrap(workspaceId, stored);
  }

  private wrap(workspaceId: string, dataKey: Buffer): WrappedDataKey {
    const { version, key } = this.masterKeys.current();
    return {
      wrappedKey: sealAesGcm(key, dataKey, dataKeyContext(workspaceId)),
      masterKeyVersion: version,
    };
  }

  private unwrap(workspaceId: string, wrapped: WrappedDataKey): Buffer {
    const masterKey = this.masterKeys.require(wrapped.masterKeyVersion);
    return openAesGcm(masterKey, wrapped.wrappedKey, dataKeyContext(workspaceId));
  }
}

function dataKeyContext(workspaceId: string): string {
  return `${DATA_KEY_CONTEXT_PREFIX}${workspaceId}`;
}
