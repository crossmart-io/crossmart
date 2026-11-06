import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FileStorage } from '@crossmart/common';
import {
  ImageContentType,
  MediaService,
  UPLOAD_ORPHAN_GRACE_MS,
  UploadBackfillService,
  UploadCleanupService,
  WORKSPACE_STORAGE_FULL_MESSAGE,
  WORKSPACE_STORAGE_MAX_BYTES,
} from '@crossmart/core';
import { PrismaService } from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const MINUTE_MS = 60 * 1000;
const EXTERNAL_IMAGE_URL = 'https://cdn.shopify.com/s/files/1/mug.png';

describe('Uploads (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: UploadCleanupService;
  let media: MediaService;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    cleanup = app.get(UploadCleanupService);
    media = app.get(MediaService);
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function upload(user: SignedUpUser): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/media/product-images`)
      .set('Cookie', user.cookie)
      .attach('file', PNG, 'photo.png');
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body.url as string;
  }

  async function createProduct(user: SignedUpUser, mediaUrls: string[]): Promise<ProductBody> {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Photographed Mug',
        media: mediaUrls.map((url) => ({ url })),
        variants: [{ price: '12' }],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body as ProductBody;
  }

  async function replaceMedia(user: SignedUpUser, product: ProductBody, urls: string[]) {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/workspaces/${user.workspaceId}/products/${product.id}`)
      .set('Cookie', user.cookie)
      .send({
        title: product.title,
        handle: product.handle,
        media: urls.map((url) => ({ url })),
        variants: [{ id: product.variants[0]!.id, price: '12' }],
      });
    expect(response.status).toBe(HttpStatus.OK);
  }

  async function isServed(url: string): Promise<boolean> {
    const response = await request(app.getHttpServer()).get(new URL(url).pathname);
    return response.status === HttpStatus.OK;
  }

  const later = (from: Date, milliseconds: number): Date => new Date(from.getTime() + milliseconds);

  it('deletes a detached image after the grace period, and the quota drops', async () => {
    const user = await signUp(app, 'Photographer');
    const url = await upload(user);
    const product = await createProduct(user, [url]);
    expect(await media.usedBytes(user.workspaceId)).toBe(PNG.length);

    expect(await cleanup.cleanUpWorkspace(user.workspaceId)).toMatchObject({ orphaned: 0 });
    await replaceMedia(user, product, []);
    const detachedAt = new Date();
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, detachedAt)).toMatchObject({
      deleted: 0,
    });

    const beforeGraceEnds = later(detachedAt, UPLOAD_ORPHAN_GRACE_MS - MINUTE_MS);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, beforeGraceEnds)).toMatchObject({
      deleted: 0,
    });
    expect(await isServed(url)).toBe(true);

    const afterGrace = later(detachedAt, UPLOAD_ORPHAN_GRACE_MS + MINUTE_MS);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, afterGrace)).toMatchObject({
      deleted: 1,
      failed: 0,
    });
    expect(await isServed(url)).toBe(false);
    expect(await media.usedBytes(user.workspaceId)).toBe(0);
  });

  it('keeps an image attached again during its grace period', async () => {
    const user = await signUp(app, 'Indecisive');
    const url = await upload(user);
    const product = await createProduct(user, [url]);
    await replaceMedia(user, product, []);
    const detachedAt = new Date();
    await cleanup.cleanUpWorkspace(user.workspaceId, detachedAt);
    const [detached] = await prisma.upload.findMany({ where: { url } });
    expect(detached?.orphanedAt).not.toBeNull();

    await replaceMedia(user, product, [url]);

    // Attaching it clears the orphan mark at once, before any cleanup run.
    const [reattached] = await prisma.upload.findMany({ where: { url } });
    expect(reattached?.orphanedAt).toBeNull();
    const afterGrace = later(detachedAt, UPLOAD_ORPHAN_GRACE_MS + MINUTE_MS);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, afterGrace)).toMatchObject({
      deleted: 0,
    });
    expect(await isServed(url)).toBe(true);
    expect(await media.usedBytes(user.workspaceId)).toBe(PNG.length);
  });

  it('deletes a deleted product’s images after the grace period, not at once', async () => {
    const user = await signUp(app, 'Declutterer');
    const url = await upload(user);
    const product = await createProduct(user, [url, EXTERNAL_IMAGE_URL]);

    const deleted = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${user.workspaceId}/products/${product.id}`)
      .set('Cookie', user.cookie);
    expect(deleted.status).toBe(HttpStatus.NO_CONTENT);
    const deletedAt = new Date();
    await cleanup.cleanUpWorkspace(user.workspaceId, deletedAt);
    expect(await isServed(url)).toBe(true);

    const afterGrace = later(deletedAt, UPLOAD_ORPHAN_GRACE_MS + MINUTE_MS);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, afterGrace)).toMatchObject({
      deleted: 1,
    });
    expect(await isServed(url)).toBe(false);
  });

  it('keeps an image uploaded but not attached yet for the grace period', async () => {
    const user = await signUp(app, 'Slow Typist');
    const uploadedAt = new Date();
    const url = await upload(user);

    await cleanup.cleanUpWorkspace(user.workspaceId, uploadedAt);
    await createProduct(user, [url]);

    const afterGrace = later(uploadedAt, UPLOAD_ORPHAN_GRACE_MS + MINUTE_MS);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId, afterGrace)).toMatchObject({
      deleted: 0,
    });
    expect(await isServed(url)).toBe(true);
  });

  it('refuses uploads with 413 once the workspace’s recorded uploads fill its storage', async () => {
    const user = await signUp(app, 'Hoarder');
    const other = await signUp(app, 'Neighbour');
    const filler = await prisma.upload.create({
      data: {
        workspaceId: user.workspaceId,
        storageKey: `workspaces/${user.workspaceId}/products/${randomUUID()}.png`,
        url: `https://media.example/${randomUUID()}.png`,
        byteSize: BigInt(WORKSPACE_STORAGE_MAX_BYTES),
        contentType: ImageContentType.Png,
      },
    });

    const refused = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/media/product-images`)
      .set('Cookie', user.cookie)
      .attach('file', PNG, 'photo.png');
    await prisma.upload.delete({ where: { id: filler.id } });

    expect(refused.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(refused.body.message).toBe(WORKSPACE_STORAGE_FULL_MESSAGE);
    expect(await upload(other)).toContain(other.workspaceId);
  });

  it('backfills files stored before tracking, once, under the URL their product uses', async () => {
    const user = await signUp(app, 'Early Adopter');
    const storage = app.get(FileStorage);
    const storageKey = `workspaces/${user.workspaceId}/products/${randomUUID()}.png`;
    const { url } = await storage.put(storageKey, PNG, ImageContentType.Png);
    const olderUrl = `http://old-host.example/media/${storageKey}`;
    await createProduct(user, [olderUrl]);
    const backfill = app.get(UploadBackfillService);

    expect((await backfill.backfill()).recorded).toBeGreaterThanOrEqual(1);
    await backfill.backfill();

    const recorded = await prisma.upload.findMany({ where: { storageKey } });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({ url: olderUrl, byteSize: BigInt(PNG.length) });
    expect(url).not.toBe(olderUrl);
    expect(await media.usedBytes(user.workspaceId)).toBe(PNG.length);
    expect(await cleanup.cleanUpWorkspace(user.workspaceId)).toMatchObject({ orphaned: 0 });
  });
});

interface ProductBody {
  id: string;
  title: string;
  handle: string;
  variants: { id: string }[];
}
