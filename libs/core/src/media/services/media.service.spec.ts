import { BadRequestException } from '@nestjs/common';
import type { FileStorage } from '@crossmart/common';
import { ImageContentType } from '../enums/image-content-type.enum.js';
import { MediaService } from './media.service.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01]);

function createService() {
  const storage = {
    put: vi.fn<FileStorage['put']>((key) => Promise.resolve({ key, url: `https://cdn/${key}` })),
    delete: vi.fn<FileStorage['delete']>(),
  };
  return { service: new MediaService(storage as unknown as FileStorage), storage };
}

describe('MediaService.uploadProductImage', () => {
  it('stores the image under the workspace with a server-chosen name', async () => {
    const { service, storage } = createService();

    const uploaded = await service.uploadProductImage('ws-1', PNG);

    const [key, , contentType] = storage.put.mock.calls[0]!;
    expect(key).toMatch(/^workspaces\/ws-1\/products\/[0-9a-f-]{36}\.png$/);
    expect(contentType).toBe(ImageContentType.Png);
    expect(uploaded).toMatchObject({ contentType: ImageContentType.Png, byteSize: PNG.length });
  });

  it('refuses anything that is not a supported image', async () => {
    const { service, storage } = createService();

    await expect(service.uploadProductImage('ws-1', Buffer.from('<svg/>'))).rejects.toThrow(
      BadRequestException,
    );
    expect(storage.put).not.toHaveBeenCalled();
  });
});
