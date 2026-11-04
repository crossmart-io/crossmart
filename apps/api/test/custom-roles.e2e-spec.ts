import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER, MailSender } from '@crossmart/common';
import { WorkspacePermission } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { linkIn, RecordingMailSender } from './support/recording-mail.sender.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

describe('Custom roles (e2e)', () => {
  let app: INestApplication<App>;
  const mail = new RecordingMailSender();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(MailSender).useValue(mail));
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const rolesUrl = (owner: SignedUpUser) => `/api/v1/workspaces/${owner.workspaceId}/roles`;

  async function createRole(
    owner: SignedUpUser,
    permissions: WorkspacePermission[],
    name = 'Stock clerk',
  ) {
    const created = await request(server())
      .post(rolesUrl(owner))
      .set('Cookie', owner.cookie)
      .send({ name, permissions });
    expect(created.status).toBe(HttpStatus.CREATED);
    return created.body as { id: string; permissions: WorkspacePermission[] };
  }

  /** Invites a fresh user with the custom role and returns them once they joined. */
  async function joinWithRole(owner: SignedUpUser, customRoleId: string): Promise<SignedUpUser> {
    const member = await signUp(app, 'Clerk');
    await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/invitations`)
      .set('Cookie', owner.cookie)
      .send({ email: member.email, role: WorkspaceRole.CUSTOM, customRoleId });
    const token = linkIn(await mail.lastTo(member.email), 'http').searchParams.get('token');
    const accepted = await request(server())
      .post('/api/v1/invitations/accept')
      .set('Cookie', member.cookie)
      .send({ token });
    expect(accepted.status).toBe(HttpStatus.OK);
    return member;
  }

  it('grants exactly the role’s permissions to a member who joins with it', async () => {
    const owner = await signUp(app, 'Owner');
    const role = await createRole(owner, [
      WorkspacePermission.ViewInventory,
      WorkspacePermission.EditInventory,
    ]);
    expect(role.permissions).toEqual([
      WorkspacePermission.ViewWorkspace,
      WorkspacePermission.ViewInventory,
      WorkspacePermission.EditInventory,
    ]);
    const clerk = await joinWithRole(owner, role.id);

    const workspace = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set('Cookie', clerk.cookie);
    expect(workspace.body).toMatchObject({
      role: WorkspaceRole.CUSTOM,
      customRole: { id: role.id, name: 'Stock clerk' },
      permissions: role.permissions,
    });
    const stock = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/inventory-items`)
      .set('Cookie', clerk.cookie);
    expect(stock.status).toBe(HttpStatus.OK);
    const products = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', clerk.cookie);
    expect(products.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('revokes members’ keys a narrowed role no longer covers, and keeps a used role', async () => {
    const owner = await signUp(app, 'Owner');
    const role = await createRole(owner, [
      WorkspacePermission.ViewInventory,
      WorkspacePermission.EditInventory,
      WorkspacePermission.ManageApiKeys,
    ]);
    const stockScript = await createRole(
      owner,
      [WorkspacePermission.ViewInventory, WorkspacePermission.EditInventory],
      'Stock script',
    );
    const clerk = await joinWithRole(owner, role.id);
    const newKey = (customRoleId: string) =>
      request(server())
        .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
        .set('Cookie', clerk.cookie)
        .send({ name: 'Script', role: WorkspaceRole.CUSTOM, customRoleId });
    const sameRoleKey = await newKey(role.id);
    const otherRoleKey = await newKey(stockScript.id);
    expect(otherRoleKey.status).toBe(HttpStatus.CREATED);

    await request(server())
      .put(`${rolesUrl(owner)}/${role.id}`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Stock viewer', permissions: [WorkspacePermission.ViewInventory] })
      .expect(HttpStatus.OK);
    const workspaceWith = (secret: string) =>
      request(server()).get(`/api/v1/workspaces/${owner.workspaceId}`).set(API_KEY_HEADER, secret);
    // Stock script can still edit stock, which the narrowed clerk no longer may: revoked.
    expect((await workspaceWith(otherRoleKey.body.secret)).status).toBe(HttpStatus.UNAUTHORIZED);
    // A key holding the clerk role itself narrows with it.
    const narrowed = await workspaceWith(sameRoleKey.body.secret);
    expect(narrowed.body.permissions).toEqual([
      WorkspacePermission.ViewWorkspace,
      WorkspacePermission.ViewInventory,
    ]);

    const deleted = await request(server())
      .delete(`${rolesUrl(owner)}/${role.id}`)
      .set('Cookie', owner.cookie);
    expect(deleted.status).toBe(HttpStatus.CONFLICT);
  });

  it('lists the built-in roles with their permissions next to the custom ones', async () => {
    const owner = await signUp(app, 'Owner');
    await createRole(owner, [WorkspacePermission.ViewOrders]);
    const catalog = await request(server()).get(rolesUrl(owner)).set('Cookie', owner.cookie);
    expect(catalog.body.builtIn.map((role: { role: string }) => role.role)).toEqual([
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.EDITOR,
      WorkspaceRole.APPROVER,
      WorkspaceRole.VIEWER,
    ]);
    expect(catalog.body.custom).toEqual([
      expect.objectContaining({ name: 'Stock clerk', memberCount: 0 }),
    ]);
  });

  it('lets nobody define a role with more than they have', async () => {
    const owner = await signUp(app, 'Owner');
    const editorKey = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Admin script', role: WorkspaceRole.ADMIN });
    const refused = await request(server())
      .post(rolesUrl(owner))
      .set(API_KEY_HEADER, editorKey.body.secret)
      .send({ name: 'Root', permissions: [WorkspacePermission.DeleteWorkspace] });
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
