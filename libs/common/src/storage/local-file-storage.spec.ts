import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalFileStorage } from './local-file-storage.js';

describe('LocalFileStorage', () => {
  let rootDir: string;
  let storage: LocalFileStorage;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'crossmart-storage-'));
    storage = new LocalFileStorage(rootDir, 'http://localhost:3000/media/');
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('writes the file and returns its public URL', async () => {
    const stored = await storage.put('ws/a.png', Buffer.from('png'), 'image/png');

    expect(stored.url).toBe('http://localhost:3000/media/ws/a.png');
    expect(await readFile(join(rootDir, 'ws/a.png'), 'utf8')).toBe('png');
  });

  it('refuses keys that leave the storage folder', async () => {
    await expect(storage.put('../escape.png', Buffer.from(''), 'image/png')).rejects.toThrow(
      /escapes/,
    );
  });
});
