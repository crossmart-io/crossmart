import type { Dirent } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { FileStorage, type StoredFile } from './file-storage.js';

const URL_PATH_SEPARATOR = '/';
const NOTHING_STORED = 0;
const MISSING_FILE = 'ENOENT';

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

  /** Walks the folder; per workspace, so the number of files stays modest. */
  async usedBytes(prefix: string): Promise<number> {
    return this.folderBytes(this.pathFor(prefix));
  }

  private async folderBytes(folder: string): Promise<number> {
    const entries = await LocalFileStorage.entriesOf(folder);
    const sizes = await Promise.all(
      entries.map(async (entry) => {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) return this.folderBytes(path);
        return entry.isFile() ? (await stat(path)).size : NOTHING_STORED;
      }),
    );
    return sizes.reduce((total, size) => total + size, NOTHING_STORED);
  }

  private static async entriesOf(folder: string): Promise<Dirent[]> {
    try {
      return await readdir(folder, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === MISSING_FILE) return [];
      throw error;
    }
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
