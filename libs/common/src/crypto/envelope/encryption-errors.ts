/** A sealed value that is malformed, was tampered with, or belongs to another scope. */
export class DecryptionError extends Error {
  constructor(message = 'The sealed value could not be decrypted') {
    super(message);
    this.name = 'DecryptionError';
  }
}

/** Encryption was asked for, but no master key is configured. */
export class EncryptionNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionNotConfiguredError';
  }
}
