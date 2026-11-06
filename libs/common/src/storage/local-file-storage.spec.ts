import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ListedFile } from './file-storage.js';
import { LocalFileStorage } from './local-file-storage.js';

async function collect(files: AsyncIterable<ListedFile>): Promise<ListedFile[]> {
  const listed: ListedFile[] = [];
  for await (const file of files) listed.push(file);
  return listed;
}

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

  it('lists the files under a folder, nested ones included', async () => {
    await storage.put('workspaces/ws-1/products/a.png', Buffer.alloc(10), 'image/png');
    await storage.put('workspaces/ws-1/other/b.png', Buffer.alloc(5), 'image/png');
    await storage.put('workspaces/ws-2/products/c.png', Buffer.alloc(100), 'image/png');

    const listed = await collect(storage.list('workspaces/ws-1'));

    expect(listed.sort((left, right) => left.key.localeCompare(right.key))).toEqual([
      {
        key: 'workspaces/ws-1/other/b.png',
        url: 'http://localhost:3000/media/workspaces/ws-1/other/b.png',
        byteSize: 5,
      },
      {
        key: 'workspaces/ws-1/products/a.png',
        url: 'http://localhost:3000/media/workspaces/ws-1/products/a.png',
        byteSize: 10,
      },
    ]);
    expect(await collect(storage.list('workspaces/ws-3'))).toEqual([]);
    await expect(collect(storage.list('../'))).rejects.toThrow(/escapes/);
  });

  it('deletes a file, and accepts one that is already gone', async () => {
    await storage.put('ws/a.png', Buffer.from('png'), 'image/png');

    await storage.delete('ws/a.png');
    await storage.delete('ws/a.png');

    expect(await collect(storage.list('ws'))).toEqual([]);
  });

  it('refuses keys that leave the storage folder', async () => {
    await expect(storage.put('../escape.png', Buffer.from(''), 'image/png')).rejects.toThrow(
      /escapes/,
    );
  });
});
