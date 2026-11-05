export interface StoredFile {
  key: string;
  /** Public URL the file can be fetched from. */
  url: string;
}

/**
 * Where uploaded files live. Implementations: `LocalFileStorage` now, S3-compatible
 * object storage (S3, R2) for the cloud.
 */
export abstract class FileStorage {
  /** Stores the content under `key`, which must come from the server, never from a client. */
  abstract put(key: string, content: Buffer, contentType: string): Promise<StoredFile>;

  abstract delete(key: string): Promise<void>;

  /** The total size in bytes of the files under the folder `prefix`; 0 when it is empty. */
  abstract usedBytes(prefix: string): Promise<number>;
}
