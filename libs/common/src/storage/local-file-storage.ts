import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { FileStorage, type StoredFile } from './file-storage.js';

const URL_PATH_SEPARATOR = '/';

/** Keeps files on local disk. The API serves them at `publicBaseUrl` (see `mountMediaFiles`). */
export class LocalFileStorage extends FileStorage {
  private readonly rootDir: string;

  constructor(
    rootDir: string,
    private readonly publicBaseUrl: string,
  ) {
    super();
    this.rootDir = resolve(rootDir);
  }

  get directory(): string {
    return this.rootDir;
  }

  // The content type matters to object storage only; files on disk are served by extension.
  async put(key: string, content: Buffer, _contentType: string): Promise<StoredFile> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
    return { key, url: `${this.publicBaseUrl.replace(/\/+$/, '')}${URL_PATH_SEPARATOR}${key}` };
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  /** Defence in depth: a key can never point outside the storage folder. */
  private pathFor(key: string): string {
    const path = resolve(this.rootDir, key);
    if (!path.startsWith(this.rootDir + sep)) {
      throw new Error(`Storage key escapes the storage folder: ${key}`);
    }
    return path;
  }
}
