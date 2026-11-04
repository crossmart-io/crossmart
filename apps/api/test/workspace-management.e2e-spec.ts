import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { WorkspaceRole } from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

describe('Creating and renaming workspaces (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function organizationOf(user: SignedUpUser): Promise<string> {
    const me = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    return me.body.workspaces[0].organizationId;
  }

  it('creates a workspace its creator owns, next to the first one', async () => {
    const owner = await signUp(app, 'Agency');
    const organizationId = await organizationOf(owner);

    const created = await request(server())
      .post(`/api/v1/organizations/${organizationId}/workspaces`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Client A', currency: 'EUR' });
    expect(created.status).toBe(HttpStatus.CREATED);
    expect(created.body).toMatchObject({
      name: 'Client A',
      slug: 'client-a',
      currency: 'EUR',
      role: WorkspaceRole.OWNER,
      organizationId,
    });

    const me = await request(server()).get('/api/v1/me').set('Cookie', owner.cookie);
    expect(me.body.workspaces.map((workspace: { name: string }) => workspace.name)).toEqual([
      'Default',
      'Client A',
    ]);
  });

  it('refuses people who own nothing in the organization', async () => {
    const owner = await signUp(app, 'Agency');
    const stranger = await signUp(app, 'Stranger');
    const refused = await request(server())
      .post(`/api/v1/organizations/${await organizationOf(owner)}/workspaces`)
      .set('Cookie', stranger.cookie)
      .send({ name: 'Mine now' });
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('renames a workspace, which then shows its own name', async () => {
    const owner = await signUp(app, 'Ana Cohen');
    const url = `/api/v1/workspaces/${owner.workspaceId}`;
    const before = await request(server()).get(url).set('Cookie', owner.cookie);
    expect(before.body.displayName).toBe('Ana Cohen');

    const renamed = await request(server())
      .patch(url)
      .set('Cookie', owner.cookie)
      .send({ name: 'Main store' });
    expect(renamed.body).toMatchObject({ name: 'Main store', displayName: 'Main store' });
  });

  it('sets a time zone that sales reports then follow', async () => {
    const owner = await signUp(app, 'Owner');
    const url = `/api/v1/workspaces/${owner.workspaceId}`;
    const invalid = await request(server())
      .patch(url)
      .set('Cookie', owner.cookie)
      .send({ timeZone: 'Mars/Olympus' });
    expect(invalid.status).toBe(HttpStatus.BAD_REQUEST);

    const updated = await request(server())
      .patch(url)
      .set('Cookie', owner.cookie)
      .send({ timeZone: 'Asia/Jerusalem' });
    expect(updated.body).toMatchObject({ timeZone: 'Asia/Jerusalem', name: 'Default' });

    const report = await request(server())
      .get(`${url}/analytics/sales`)
      .set('Cookie', owner.cookie);
    expect(report.body.timeZone).toBe('Asia/Jerusalem');
  });
});
