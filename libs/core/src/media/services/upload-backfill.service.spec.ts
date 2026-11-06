import type { FileStorage, ListedFile } from '@crossmart/common';
import { ImageContentType } from '../enums/image-content-type.enum.js';
import { UPLOAD_BACKFILL_BATCH_SIZE } from '../media.constants.js';
import type { UploadRepository } from '../repositories/upload.repository.js';
import { UploadBackfillService } from './upload-backfill.service.js';

const WORKSPACE_ID = '0b7f3c1e-2a4d-4e5f-8a9b-1c2d3e4f5a6b';
const BASE_URL = 'https://api.example/media';

function listed(fileName: string, byteSize = 10): ListedFile {
  const key = `workspaces/${WORKSPACE_ID}/products/${fileName}`;
  return { key, url: `${BASE_URL}/${key}`, byteSize };
}

async function* listing(files: ListedFile[]): AsyncIterable<ListedFile> {
  yield* files;
}

function createService(files: ListedFile[]) {
  const storage = { list: vi.fn<FileStorage['list']>(() => listing(files)) };
  const uploads = {
    findReferencingUrls: vi
      .fn<UploadRepository['findReferencingUrls']>()
      .mockResolvedValue(new Map()),
    recordMissing: vi
      .fn<UploadRepository['recordMissing']>()
      .mockImplementation((batch) => Promise.resolve(batch.length)),
  };
  const service = new UploadBackfillService(
    storage as unknown as FileStorage,
    uploads as unknown as UploadRepository,
  );
  return { service, storage, uploads };
}

describe('UploadBackfillService', () => {
  it('records each stored product image with its workspace, size and format', async () => {
    const { service, storage, uploads } = createService([listed('a.png', 12), listed('b.jpg')]);

    const report = await service.backfill();

    expect(storage.list).toHaveBeenCalledWith('workspaces');
    expect(report).toEqual({ recorded: 2, alreadyRecorded: 0, skipped: 0 });
    expect(uploads.recordMissing.mock.calls[0]![0]).toEqual([
      {
        workspaceId: WORKSPACE_ID,
        storageKey: listed('a.png').key,
        url: listed('a.png').url,
        byteSize: 12,
        contentType: ImageContentType.Png,
      },
      expect.objectContaining({ contentType: ImageContentType.Jpeg }),
    ]);
  });

  it('records a used file under the URL its product uses', async () => {
    const file = listed('a.png');
    const { service, uploads } = createService([file]);
    const olderUrl = `http://localhost:3000/media/${file.key}`;
    uploads.findReferencingUrls.mockResolvedValue(new Map([[file.key, olderUrl]]));

    await service.backfill();

    expect(uploads.recordMissing.mock.calls[0]![0][0]).toMatchObject({ url: olderUrl });
  });

  it('counts files already recorded, so running it again changes nothing', async () => {
    const { service, uploads } = createService([listed('a.png'), listed('b.png')]);
    uploads.recordMissing.mockResolvedValue(0);

    expect(await service.backfill()).toEqual({ recorded: 0, alreadyRecorded: 2, skipped: 0 });
  });

  it('leaves files outside the product image layout alone', async () => {
    const stray = { key: 'workspaces/notes.txt', url: `${BASE_URL}/notes.txt`, byteSize: 1 };
    const { service, uploads } = createService([stray]);

    expect(await service.backfill()).toEqual({ recorded: 0, alreadyRecorded: 0, skipped: 1 });
    expect(uploads.recordMissing).not.toHaveBeenCalled();
  });

  it('writes in batches', async () => {
    const files = Array.from({ length: UPLOAD_BACKFILL_BATCH_SIZE + 1 }, (_, index) =>
      listed(`${index}.png`),
    );
    const { service, uploads } = createService(files);

    const report = await service.backfill();

    expect(uploads.recordMissing).toHaveBeenCalledTimes(2);
    expect(report.recorded).toBe(files.length);
  });
});
