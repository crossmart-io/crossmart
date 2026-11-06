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

  it('sums the sizes of the files under a folder, nested ones included', async () => {
    await storage.put('workspaces/ws-1/products/a.png', Buffer.alloc(10), 'image/png');
    await storage.put('workspaces/ws-1/other/b.png', Buffer.alloc(5), 'image/png');
    await storage.put('workspaces/ws-2/products/c.png', Buffer.alloc(100), 'image/png');

    expect(await storage.usedBytes('workspaces/ws-1')).toBe(15);
    expect(await storage.usedBytes('workspaces/ws-3')).toBe(0);
    await expect(storage.usedBytes('../')).rejects.toThrow(/escapes/);
  });

  it('refuses keys that leave the storage folder', async () => {
    await expect(storage.put('../escape.png', Buffer.from(''), 'image/png')).rejects.toThrow(
      /escapes/,
    );
  });
});
