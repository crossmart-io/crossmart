import { randomBytes } from 'node:crypto';
import { AesGcmEnvelopeEncryption } from './aes-gcm-envelope-encryption.js';
import { DecryptionError, EncryptionNotConfiguredError } from './encryption-errors.js';
import { InMemoryDataKeyStore } from './in-memory-data-key-store.js';
import { MasterKeyRing } from './master-key-ring.js';

const KEY_V1 = randomBytes(32).toString('base64');
const KEY_V2 = randomBytes(32).toString('base64');
const SCOPE = { workspaceId: 'ws-1', context: 'channel-connection:shopify' };

function setup(ring = MasterKeyRing.fromSettings({ currentKey: KEY_V1, currentVersion: 1 })) {
  const store = new InMemoryDataKeyStore();
  return { store, encryption: new AesGcmEnvelopeEncryption(ring, store) };
}

describe('AesGcmEnvelopeEncryption', () => {
  it('creates one wrapped data key per workspace and round-trips secrets', async () => {
    const { store, encryption } = setup();

    const first = await encryption.encrypt(SCOPE, 'token-1');
    const second = await encryption.encrypt(SCOPE, 'token-2');

    expect(store.keys.size).toBe(1);
    expect(store.keys.get('ws-1')?.masterKeyVersion).toBe(1);
    expect(await encryption.decrypt(SCOPE, first)).toBe('token-1');
    expect(await encryption.decrypt(SCOPE, second)).toBe('token-2');
  });

  it('keeps workspaces apart: a value sealed for one never opens in another', async () => {
    const { store, encryption } = setup();
    const sealed = await encryption.encrypt(SCOPE, 'token');
    await encryption.encrypt({ ...SCOPE, workspaceId: 'ws-2' }, 'other');

    expect(store.keys.get('ws-1')?.wrappedKey).not.toBe(store.keys.get('ws-2')?.wrappedKey);
    await expect(encryption.decrypt({ ...SCOPE, workspaceId: 'ws-2' }, sealed)).rejects.toThrow(
      DecryptionError,
    );
    await expect(encryption.decrypt({ ...SCOPE, context: 'other' }, sealed)).rejects.toThrow(
      DecryptionError,
    );
  });

  it('refuses a data key moved to another workspace', async () => {
    const { store, encryption } = setup();
    await encryption.encrypt(SCOPE, 'token');
    const moved = store.keys.get('ws-1');
    if (!moved) throw new Error('missing key');
    store.keys.set('ws-2', moved);

    await expect(encryption.encrypt({ ...SCOPE, workspaceId: 'ws-2' }, 'x')).rejects.toThrow(
      DecryptionError,
    );
  });

  it('rewraps data keys after a master key rotation, keeping old values readable', async () => {
    const { store, encryption } = setup();
    const sealed = await encryption.encrypt(SCOPE, 'token');
    const rotated = new AesGcmEnvelopeEncryption(
      MasterKeyRing.fromSettings({
        currentKey: KEY_V2,
        currentVersion: 2,
        retiredKeys: `1:${KEY_V1}`,
      }),
      store,
    );

    expect(await rotated.decrypt(SCOPE, sealed)).toBe('token');
    expect(await rotated.rewrapDataKey('ws-1')).toBe(true);
    expect(store.keys.get('ws-1')?.masterKeyVersion).toBe(2);
    expect(await rotated.rewrapDataKey('ws-1')).toBe(false);

    const withoutOldKey = new AesGcmEnvelopeEncryption(
      MasterKeyRing.fromSettings({ currentKey: KEY_V2, currentVersion: 2 }),
      store,
    );
    expect(await withoutOldKey.decrypt(SCOPE, sealed)).toBe('token');
  });

  it('uses the stored key when another call created one first', async () => {
    const { store, encryption } = setup();
    const racing = new AesGcmEnvelopeEncryption(
      MasterKeyRing.fromSettings({ currentKey: KEY_V1, currentVersion: 1 }),
      store,
    );
    const [first, second] = await Promise.all([
      encryption.encrypt(SCOPE, 'a'),
      racing.encrypt(SCOPE, 'b'),
    ]);

    expect(await encryption.decrypt(SCOPE, second)).toBe('b');
    expect(await racing.decrypt(SCOPE, first)).toBe('a');
  });

  it('reports a missing master key instead of storing secrets unprotected', async () => {
    const { encryption } = setup(MasterKeyRing.fromSettings({ currentVersion: 1 }));

    expect(encryption.isConfigured).toBe(false);
    await expect(encryption.encrypt(SCOPE, 'token')).rejects.toThrow(EncryptionNotConfiguredError);
  });
});
