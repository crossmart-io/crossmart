import { randomBytes } from 'node:crypto';
import { EncryptionNotConfiguredError } from './encryption-errors.js';
import { MasterKeyRing } from './master-key-ring.js';

const KEY_V1 = randomBytes(32).toString('base64');
const KEY_V2 = randomBytes(32).toString('base64');

describe('MasterKeyRing', () => {
  it('serves the current key and retired keys by version', () => {
    const ring = MasterKeyRing.fromSettings({
      currentKey: KEY_V2,
      currentVersion: 2,
      retiredKeys: `1:${KEY_V1}`,
    });

    expect(ring.isConfigured).toBe(true);
    expect(ring.current().version).toBe(2);
    expect(ring.current().key.toString('base64')).toBe(KEY_V2);
    expect(ring.require(1).toString('base64')).toBe(KEY_V1);
  });

  it('is not configured without a current key, and says so when used', () => {
    const ring = MasterKeyRing.fromSettings({ currentVersion: 1 });

    expect(ring.isConfigured).toBe(false);
    expect(() => ring.current()).toThrow(EncryptionNotConfiguredError);
    expect(() => ring.current()).toThrow(/CREDENTIALS_MASTER_KEY/);
  });

  it('rejects keys that are not 32 bytes and malformed retired entries', () => {
    const shortKey = randomBytes(16).toString('base64');

    expect(() => MasterKeyRing.fromSettings({ currentKey: shortKey, currentVersion: 1 })).toThrow(
      RangeError,
    );
    expect(() => MasterKeyRing.fromSettings({ currentVersion: 2, retiredKeys: KEY_V1 })).toThrow(
      RangeError,
    );
  });

  it('never puts key material in its error messages', () => {
    const shortKey = randomBytes(16).toString('base64');

    expect(() => MasterKeyRing.fromSettings({ currentKey: shortKey, currentVersion: 1 })).toThrow(
      expect.not.objectContaining({ message: expect.stringContaining(shortKey) }),
    );
  });
});
