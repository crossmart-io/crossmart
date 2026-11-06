import type { Dirent } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { FileStorage, type ListedFile, type StoredFile } from './file-storage.js';

const URL_PATH_SEPARATOR = '/';
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
    return { key, url: this.urlFor(key) };
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  /** Walks the folder one directory at a time, so a large one is never held in memory. */
  async *list(prefix: string): AsyncIterable<ListedFile> {
    yield* this.filesIn(this.pathFor(prefix));
  }

  private async *filesIn(folder: string): AsyncIterable<ListedFile> {
    for (const entry of await LocalFileStorage.entriesOf(folder)) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        yield* this.filesIn(path);
      } else if (entry.isFile()) {
        const key = relative(this.rootDir, path).split(sep).join(URL_PATH_SEPARATOR);
        yield { key, url: this.urlFor(key), byteSize: (await stat(path)).size };
      }
    }
  }

  private urlFor(key: string): string {
    return `${this.publicBaseUrl.replace(/\/+$/, '')}${URL_PATH_SEPARATOR}${key}`;
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
