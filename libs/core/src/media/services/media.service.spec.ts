import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { FileStorage } from '@crossmart/common';
import { ImageContentType } from '../enums/image-content-type.enum.js';
import { WORKSPACE_STORAGE_MAX_BYTES } from '../media.constants.js';
import type { UploadRepository } from '../repositories/upload.repository.js';
import { MediaService } from './media.service.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

function createService() {
  const storage = {
    put: vi.fn<FileStorage['put']>((key) => Promise.resolve({ key, url: `https://cdn/${key}` })),
    delete: vi.fn<FileStorage['delete']>().mockResolvedValue(),
  };
  const uploads = {
    usedBytes: vi.fn<UploadRepository['usedBytes']>().mockResolvedValue(0),
    record: vi.fn<UploadRepository['record']>().mockResolvedValue(),
  };
  const service = new MediaService(
    storage as unknown as FileStorage,
    uploads as unknown as UploadRepository,
  );
  return { service, storage, uploads };
}

describe('MediaService.uploadProductImage', () => {
  it('stores the image under the workspace with a server-chosen name, and records it', async () => {
    const { service, storage, uploads } = createService();

    const uploaded = await service.uploadProductImage('ws-1', PNG);

    const [key, , contentType] = storage.put.mock.calls[0]!;
    expect(key).toMatch(/^workspaces\/ws-1\/products\/[0-9a-f-]{36}\.png$/);
    expect(contentType).toBe(ImageContentType.Png);
    expect(uploaded).toEqual({
      url: `https://cdn/${key}`,
      contentType: ImageContentType.Png,
      byteSize: PNG.length,
    });
    expect(uploads.record).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      storageKey: key,
      url: `https://cdn/${key}`,
      byteSize: PNG.length,
      contentType: ImageContentType.Png,
    });
  });

  it('refuses anything that is not a supported image', async () => {
    const { service, storage } = createService();

    await expect(service.uploadProductImage('ws-1', Buffer.from('<svg/>'))).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('counts the workspace’s recorded uploads, and stores up to the cap', async () => {
    const { service, storage, uploads } = createService();
    uploads.usedBytes.mockResolvedValue(WORKSPACE_STORAGE_MAX_BYTES - PNG.length);

    await service.uploadProductImage('ws-1', PNG);

    expect(uploads.usedBytes).toHaveBeenCalledWith('ws-1');
    expect(storage.put).toHaveBeenCalled();
  });

  it('refuses an upload past the workspace’s storage cap with 413', async () => {
    const { service, storage, uploads } = createService();
    uploads.usedBytes.mockResolvedValue(WORKSPACE_STORAGE_MAX_BYTES - PNG.length + 1);

    await expect(service.uploadProductImage('ws-1', PNG)).rejects.toThrow(PayloadTooLargeException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('deletes the stored file when it cannot be recorded, so none escapes the quota', async () => {
    const { service, storage, uploads } = createService();
    uploads.record.mockRejectedValue(new Error('database down'));

    await expect(service.uploadProductImage('ws-1', PNG)).rejects.toThrow('database down');

    const [key] = storage.put.mock.calls[0]!;
    expect(storage.delete).toHaveBeenCalledWith(key);
  });
});
