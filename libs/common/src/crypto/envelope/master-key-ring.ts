import {
  KEY_BYTES,
  MASTER_KEY_ENCODING,
  MASTER_KEY_MISSING,
  RETIRED_KEY_VERSION_SEPARATOR,
  RETIRED_KEYS_SEPARATOR,
} from './envelope.constants.js';
import { EncryptionNotConfiguredError } from './encryption-errors.js';

export interface MasterKey {
  version: number;
  key: Buffer;
}

export interface MasterKeySettings {
  /** Base64 of 32 random bytes: `openssl rand -base64 32`. */
  currentKey?: string;
  currentVersion: number;
  /** Keys rotated out but still needed to unwrap data keys: `1:<key>,2:<key>`. */
  retiredKeys?: string;
}

/**
 * The master keys that wrap workspace data keys. New data keys are wrapped with the current
 * version; retired versions stay readable until every data key has been rewrapped.
 */
export class MasterKeyRing {
  private constructor(
    private readonly currentVersion: number,
    private readonly keys: ReadonlyMap<number, Buffer>,
  ) {}

  static fromSettings(settings: MasterKeySettings): MasterKeyRing {
    const keys = new Map(parseRetiredKeys(settings.retiredKeys));
    if (settings.currentKey) {
      keys.set(settings.currentVersion, decodeKey(settings.currentKey, settings.currentVersion));
    }
    return new MasterKeyRing(settings.currentVersion, keys);
  }

  get isConfigured(): boolean {
    return this.keys.has(this.currentVersion);
  }

  current(): MasterKey {
    return { version: this.currentVersion, key: this.require(this.currentVersion) };
  }

  /** The key of a version, current or retired. */
  require(version: number): Buffer {
    const key = this.keys.get(version);
    if (!key) {
      throw new EncryptionNotConfiguredError(
        version === this.currentVersion
          ? MASTER_KEY_MISSING
          : `Master key version ${version} is not configured`,
      );
    }
    return key;
  }
}

function decodeKey(encoded: string, version: number): Buffer {
  const key = Buffer.from(encoded.trim(), MASTER_KEY_ENCODING);
  if (key.length !== KEY_BYTES) {
    throw new RangeError(
      `Master key version ${version} must be ${KEY_BYTES} bytes, base64 encoded`,
    );
  }
  return key;
}

function parseRetiredKeys(retiredKeys: string | undefined): [number, Buffer][] {
  if (!retiredKeys?.trim()) {
    return [];
  }
  return retiredKeys.split(RETIRED_KEYS_SEPARATOR).map((entry) => {
    const separatorIndex = entry.indexOf(RETIRED_KEY_VERSION_SEPARATOR);
    const version = Number(entry.slice(0, separatorIndex));
    if (separatorIndex < 0 || !Number.isInteger(version) || version < 1) {
      throw new RangeError('CREDENTIALS_RETIRED_MASTER_KEYS entries read <version>:<base64 key>');
    }
    return [version, decodeKey(entry.slice(separatorIndex + 1), version)];
  });
}
