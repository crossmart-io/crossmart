import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { CatalogImportFormat, CatalogImportMode, WorkspacePermission } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

describe('Permissions (e2e)', () => {
  let app: INestApplication<App>;
  let owner: SignedUpUser;

  beforeAll(async () => {
    app = await createTestApp();
    owner = await signUp(app, 'Owner');
  });

  afterAll(async () => {
    await app.close();
  });

  async function keyWithRole(role: WorkspaceRole): Promise<string> {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: role, role });
    return created.body.secret;
  }

  it('tells each caller the permissions of its role', async () => {
    const viewerKey = await keyWithRole(WorkspaceRole.VIEWER);
    const asViewer = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(API_KEY_HEADER, viewerKey);
    expect(asViewer.body.permissions).toContain(WorkspacePermission.ViewOrders);
    expect(asViewer.body.permissions).not.toContain(WorkspacePermission.EditProducts);

    const asOwner = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set('Cookie', owner.cookie);
    expect(asOwner.body.permissions).toEqual(Object.values(WorkspacePermission));
  });

  it('checks a stock import against inventory:edit', async () => {
    const approverKey = await keyWithRole(WorkspaceRole.APPROVER);
    const refused = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/product-imports`)
      .set(API_KEY_HEADER, approverKey)
      .field('mode', CatalogImportMode.Inventory)
      .field('format', CatalogImportFormat.InventoryCsv)
      .attach('file', Buffer.from('sku,available\nA-1,3\n'), 'stock.csv');
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
    expect(refused.body.message).toBe(
      `Requires the ${WorkspacePermission.EditInventory} permission`,
    );
  });

  it('keeps store management for admins', async () => {
    const editorKey = await keyWithRole(WorkspaceRole.EDITOR);
    const refused = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/channel-connections/authorizations`)
      .set(API_KEY_HEADER, editorKey)
      .send({});
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
  });
});
