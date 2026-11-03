/** AES-256-GCM: a 256-bit key, the 96-bit IV NIST recommends and a full 128-bit tag. */
export const CIPHER_ALGORITHM = 'aes-256-gcm';
export const KEY_BYTES = 32;
export const IV_BYTES = 12;
export const AUTH_TAG_BYTES = 16;

/** Sealed values read `v1.<iv>.<tag>.<ciphertext>`, each part base64url. */
export const SEALED_FORMAT_VERSION = 'v1';
export const SEALED_PART_SEPARATOR = '.';
export const SEALED_ENCODING = 'base64url';
export const MASTER_KEY_ENCODING = 'base64';

/** Binds a wrapped data key to its workspace, so it cannot be moved to another one. */
export const DATA_KEY_CONTEXT_PREFIX = 'crossmart:data-key:';

/** Separates versioned keys in `CREDENTIALS_RETIRED_MASTER_KEYS`: `1:<key>,2:<key>`. */
export const RETIRED_KEYS_SEPARATOR = ',';
export const RETIRED_KEY_VERSION_SEPARATOR = ':';

export const MASTER_KEY_MISSING =
  'CREDENTIALS_MASTER_KEY is not set, so channel credentials cannot be stored';
