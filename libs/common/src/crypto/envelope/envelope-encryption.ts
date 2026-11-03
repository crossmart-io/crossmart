/**
 * What a sealed secret belongs to. The workspace picks the data key; the context (such as
 * `channel-connection:<id>`) is authenticated, so a value only opens where it was sealed.
 */
export interface SecretScope {
  workspaceId: string;
  context: string;
}

/**
 * Envelope encryption for secrets at rest, such as channel credentials: each workspace has
 * its own data key, wrapped by a master key from the environment (or a KMS later).
 */
export abstract class EnvelopeEncryption {
  /** False when no master key is configured; `encrypt` and `decrypt` throw then. */
  abstract get isConfigured(): boolean;

  abstract encrypt(scope: SecretScope, plaintext: string): Promise<string>;

  /** Throws `DecryptionError` when the value was tampered with or belongs to another scope. */
  abstract decrypt(scope: SecretScope, sealed: string): Promise<string>;

  /** Rewraps the workspace's data key with the current master key, after a rotation. */
  abstract rewrapDataKey(workspaceId: string): Promise<boolean>;
}
