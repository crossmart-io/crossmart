import { ImageContentType } from '../enums/image-content-type.enum.js';
import { parseProductImageKey, productImageKey } from './product-image-key.js';

const WORKSPACE_ID = '0b7f3c1e-2a4d-4e5f-8a9b-1c2d3e4f5a6b';

describe('productImageKey', () => {
  it('names the file randomly, inside the workspace’s product images folder', () => {
    const key = productImageKey(WORKSPACE_ID, ImageContentType.Webp);

    expect(key).toMatch(new RegExp(`^workspaces/${WORKSPACE_ID}/products/[0-9a-f-]{36}\\.webp$`));
    expect(productImageKey(WORKSPACE_ID, ImageContentType.Webp)).not.toBe(key);
  });
});

describe('parseProductImageKey', () => {
  it('reads back the workspace and format of a key it made', () => {
    const key = productImageKey(WORKSPACE_ID, ImageContentType.Jpeg);

    expect(parseProductImageKey(key)).toEqual({
      workspaceId: WORKSPACE_ID,
      contentType: ImageContentType.Jpeg,
    });
  });

  it.each([
    ['another folder', `workspaces/${WORKSPACE_ID}/exports/a.png`],
    ['a workspace id that is not a UUID', 'workspaces/acme/products/a.png'],
    ['a nested file', `workspaces/${WORKSPACE_ID}/products/old/a.png`],
    ['an unsupported format', `workspaces/${WORKSPACE_ID}/products/a.svg`],
    ['a file without an extension', `workspaces/${WORKSPACE_ID}/products/png`],
    ['a file outside the workspaces', 'exports/a.png'],
  ])('ignores %s', (_label, key) => {
    expect(parseProductImageKey(key)).toBeNull();
  });
});
