import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER, MailSender } from '@crossmart/common';
import { WorkspaceRole } from '@crossmart/database';
import { linkIn, RecordingMailSender } from './support/recording-mail.sender.js';
import { createTestApp, signUp as signUpUser, type SignedUpUser } from './support/test-app.js';

const INVITATIONS = '/api/v1/invitations';

describe('Members and invitations (e2e)', () => {
  let app: INestApplication<App>;
  const mail = new RecordingMailSender();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(MailSender).useValue(mail));
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const signUp = (name: string): Promise<SignedUpUser> => signUpUser(app, name);
  const membersUrl = (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members`;

  /** Invites `invitee` into the owner's workspace and returns the token from the email. */
  async function invite(owner: SignedUpUser, email: string, role: WorkspaceRole): Promise<string> {
    const invited = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/invitations`)
      .set('Cookie', owner.cookie)
      .send({ email: email.toUpperCase(), role });
    expect(invited.status).toBe(HttpStatus.CREATED);
    const message = await mail.lastTo(email);
    return linkIn(message, 'http').searchParams.get('token') ?? '';
  }

  async function memberIds(owner: SignedUpUser): Promise<Record<string, string>> {
    const members = await request(server())
      .get(membersUrl(owner.workspaceId))
      .set('Cookie', owner.cookie);
    return Object.fromEntries(
      members.body.map((member: { email: string; userId: string }) => [
        member.email,
        member.userId,
      ]),
    );
  }

  it('invites by email, previews the link openly and adds the invitee on accepting', async () => {
    const owner = await signUp('Owner');
    const invitee = await signUp('Invitee');
    const token = await invite(owner, invitee.email, WorkspaceRole.EDITOR);

    const preview = await request(server()).post(`${INVITATIONS}/preview`).send({ token });
    expect(preview.body).toMatchObject({ email: invitee.email, role: WorkspaceRole.EDITOR });

    const stranger = await signUp('Stranger');
    const wrongAccount = await request(server())
      .post(`${INVITATIONS}/accept`)
      .set('Cookie', stranger.cookie)
      .send({ token });
    expect(wrongAccount.status).toBe(HttpStatus.FORBIDDEN);

    const accepted = await request(server())
      .post(`${INVITATIONS}/accept`)
      .set('Cookie', invitee.cookie)
      .send({ token });
    expect(accepted.body).toEqual({ workspaceId: owner.workspaceId, role: WorkspaceRole.EDITOR });

    const again = await request(server())
      .post(`${INVITATIONS}/accept`)
      .set('Cookie', invitee.cookie)
      .send({ token });
    expect(again.status).toBe(HttpStatus.NOT_FOUND);
    expect(Object.keys(await memberIds(owner))).toContain(invitee.email);
  });

  it('lists and revokes pending invitations', async () => {
    const owner = await signUp('Owner');
    const token = await invite(owner, 'pending@example.com', WorkspaceRole.VIEWER);
    const url = `/api/v1/workspaces/${owner.workspaceId}/invitations`;

    const pending = await request(server()).get(url).set('Cookie', owner.cookie);
    expect(pending.body).toHaveLength(1);
    const revoked = await request(server())
      .delete(`${url}/${pending.body[0].id}`)
      .set('Cookie', owner.cookie);
    expect(revoked.status).toBe(HttpStatus.NO_CONTENT);

    const preview = await request(server()).post(`${INVITATIONS}/preview`).send({ token });
    expect(preview.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('changes roles within the manager’s own and keeps an owner', async () => {
    const owner = await signUp('Owner');
    const admin = await signUp('Admin');
    const token = await invite(owner, admin.email, WorkspaceRole.ADMIN);
    await request(server())
      .post(`${INVITATIONS}/accept`)
      .set('Cookie', admin.cookie)
      .send({ token });
    const ids = await memberIds(owner);
    const ownerId = ids[owner.email] ?? '';
    const adminId = ids[admin.email] ?? '';

    const adminDemotesOwner = await request(server())
      .patch(`${membersUrl(owner.workspaceId)}/${ownerId}`)
      .set('Cookie', admin.cookie)
      .send({ role: WorkspaceRole.VIEWER });
    expect(adminDemotesOwner.status).toBe(HttpStatus.FORBIDDEN);

    const ownerLeaves = await request(server())
      .delete(`/api/v1/workspaces/${owner.workspaceId}/membership`)
      .set('Cookie', owner.cookie);
    expect(ownerLeaves.status).toBe(HttpStatus.CONFLICT);

    const demoted = await request(server())
      .patch(`${membersUrl(owner.workspaceId)}/${adminId}`)
      .set('Cookie', owner.cookie)
      .send({ role: WorkspaceRole.VIEWER });
    expect(demoted.body.role).toBe(WorkspaceRole.VIEWER);
  });

  it('removes a member and the API keys they created', async () => {
    const owner = await signUp('Owner');
    const admin = await signUp('Admin');
    const token = await invite(owner, admin.email, WorkspaceRole.ADMIN);
    await request(server())
      .post(`${INVITATIONS}/accept`)
      .set('Cookie', admin.cookie)
      .send({ token });
    const created = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', admin.cookie)
      .send({ name: 'Script', role: WorkspaceRole.EDITOR });
    const adminId = (await memberIds(owner))[admin.email] ?? '';

    const removed = await request(server())
      .delete(`${membersUrl(owner.workspaceId)}/${adminId}`)
      .set('Cookie', owner.cookie);
    expect(removed.status).toBe(HttpStatus.NO_CONTENT);

    const withKey = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set(API_KEY_HEADER, created.body.secret);
    expect(withKey.status).toBe(HttpStatus.UNAUTHORIZED);
    const asAdmin = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}`)
      .set('Cookie', admin.cookie);
    expect(asAdmin.status).toBe(HttpStatus.NOT_FOUND);
  });
});
