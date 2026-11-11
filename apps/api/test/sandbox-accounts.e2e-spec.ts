import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER, MailSender } from '@crossmart/common';
import {
  AgentApprovalExemption,
  AgentProposalOutcome,
  EntitlementErrorCode,
  SANDBOX_CLAIM_REMINDER_AFTER_MS,
  SANDBOX_MAX_PRODUCTS,
  SANDBOX_TTL_MS,
  SandboxOpeningOutcome,
  SandboxRestriction,
  SandboxSweeper,
} from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import { linkIn, RecordingMailSender } from './support/recording-mail.sender.js';
import { createTestApp, signUp } from './support/test-app.js';

const AUTH = '/api/auth';
const SANDBOX_ACCOUNTS = '/api/v1/sandbox-accounts';
const CLAIMS = '/api/v1/sandbox-claims';
const CLIENT_IP_HEADER = 'x-real-ip';
const PASSWORD = 'a-sandbox-owner-password';
const WEB_RESET_PAGE = 'http://localhost:5179/reset-password';
const PRODUCT_BATCH = 20;

interface OpenedSandbox {
  email: string;
  workspaceId: string;
  apiKey: string;
  claimToken: string;
}

describe('Sandbox accounts (e2e)', () => {
  let app: INestApplication<App>;
  const mail = new RecordingMailSender();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(MailSender).useValue(mail));
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  /** A caller address of its own, so each test has fresh rate-limit windows. */
  const freshIp = () => `sandbox-${randomUUID()}`;

  function openSandbox(email: string, ip = freshIp()) {
    return request(server())
      .post(SANDBOX_ACCOUNTS)
      .set(CLIENT_IP_HEADER, ip)
      .send({ email, storeName: 'Ana Ceramics' });
  }

  async function claimTokenFor(email: string): Promise<string> {
    const message = await mail.lastTo(email);
    return linkIn(message, 'http').searchParams.get('token') ?? '';
  }

  async function opened(): Promise<OpenedSandbox> {
    const email = `${randomUUID()}@example.com`;
    const response = await openSandbox(email);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.outcome).toBe(SandboxOpeningOutcome.Created);
    const { workspaceId, apiKey } = response.body;
    return { email, workspaceId, apiKey, claimToken: await claimTokenFor(email) };
  }

  function createProduct(sandbox: OpenedSandbox, title: string) {
    return request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/products`)
      .set(API_KEY_HEADER, sandbox.apiKey)
      .send({ title, variants: [{ price: '12' }] });
  }

  /** The owner signs in without claiming, through a password reset as Better Auth sends it. */
  async function signInByReset(email: string): Promise<string> {
    await request(server())
      .post(`${AUTH}/request-password-reset`)
      .send({ email, redirectTo: WEB_RESET_PAGE });
    const link = linkIn(await mail.lastTo(email), 'http');
    const opened = await request(server()).get(`${link.pathname}${link.search}`);
    const token = new URL(opened.headers.location).searchParams.get('token');
    await request(server()).post(`${AUTH}/reset-password`).send({ token, newPassword: PASSWORD });
    const signIn = await request(server())
      .post(`${AUTH}/sign-in/email`)
      .send({ email, password: PASSWORD });
    expect(signIn.status).toBe(HttpStatus.OK);
    return [signIn.headers['set-cookie']].flat().join('; ');
  }

  function expectClaimRequired(response: request.Response, restriction: SandboxRestriction): void {
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(response.body).toMatchObject({
      code: EntitlementErrorCode.SandboxClaimRequired,
      restriction,
    });
    expect(response.body.message).toContain('Ask the user to claim it');
  }

  it('opens a sandbox with an agent key, emails the claim link and marks the workspace', async () => {
    const sandbox = await opened();
    expect(sandbox.apiKey).toMatch(/^cm_/);
    expect(sandbox.claimToken).not.toBe('');
    expect((await mail.lastTo(sandbox.email)).subject).toBe(
      'An AI agent opened a Crossmart account for you',
    );

    const workspace = await request(server())
      .get(`/api/v1/workspaces/${sandbox.workspaceId}`)
      .set(API_KEY_HEADER, sandbox.apiKey);
    expect(workspace.status).toBe(HttpStatus.OK);
    expect(workspace.body).toMatchObject({
      displayName: 'Ana Ceramics',
      role: WorkspaceRole.EDITOR,
    });
    expect(new Date(workspace.body.sandbox.claimExpiresAt).getTime()).toBeGreaterThan(
      Date.now() + SANDBOX_TTL_MS - 60_000,
    );

    expect((await createProduct(sandbox, 'Stoneware Mug')).status).toBe(HttpStatus.CREATED);
  });

  it('answers the same for any address that has an account, and sends nothing', async () => {
    const customer = await signUp(app, 'Customer');
    const sandbox = await opened();
    const sentBefore = mail.sent.length;

    for (const email of [customer.email, sandbox.email, sandbox.email.toUpperCase()]) {
      const response = await openSandbox(email);
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        outcome: SandboxOpeningOutcome.SignInRequired,
        workspaceId: null,
        apiKey: null,
      });
      expect(response.body.nextStep).toContain('OAuth');
    }
    expect(mail.sent.length).toBe(sentBefore);
  });

  it('opens at most five a caller an hour', async () => {
    const ip = freshIp();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await openSandbox(`${randomUUID()}@example.com`, ip)).status).toBe(HttpStatus.OK);
    }
    const refused = await openSandbox(`${randomUUID()}@example.com`, ip);
    expect(refused.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await openSandbox(`${randomUUID()}@example.com`)).status).toBe(HttpStatus.OK);
  });

  it(`holds at most ${SANDBOX_MAX_PRODUCTS} products until claimed`, async () => {
    const sandbox = await opened();
    for (let start = 0; start < SANDBOX_MAX_PRODUCTS; start += PRODUCT_BATCH) {
      const batch = Array.from({ length: PRODUCT_BATCH }, (_, index) =>
        createProduct(sandbox, `Mug ${start + index}`),
      );
      for (const response of await Promise.all(batch)) {
        expect(response.status).toBe(HttpStatus.CREATED);
      }
    }

    expectClaimRequired(
      await createProduct(sandbox, 'One too many'),
      SandboxRestriction.AddProducts,
    );
    // A new draft needs no approval, but the sandbox's limit still holds for it.
    const proposed = await request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/agent-proposals`)
      .set(API_KEY_HEADER, sandbox.apiKey)
      .send({ tool: 'create_product', input: { title: 'Draft', variants: [{ price: '12' }] } });
    expect(proposed.body).toMatchObject({
      outcome: AgentProposalOutcome.ApplyDirectly,
      exemption: AgentApprovalExemption.NewDraft,
    });
    expectClaimRequired(await createProduct(sandbox, 'Draft'), SandboxRestriction.AddProducts);
  });

  it('refuses invitations and new workspaces to the owner until claimed', async () => {
    const sandbox = await opened();
    const cookie = await signInByReset(sandbox.email);
    const me = await request(server()).get('/api/v1/me').set('Cookie', cookie);
    const [workspace] = me.body.workspaces;
    expect(workspace.sandbox).not.toBeNull();

    const invite = await request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/invitations`)
      .set('Cookie', cookie)
      .send({ email: `${randomUUID()}@example.com`, role: WorkspaceRole.EDITOR });
    expectClaimRequired(invite, SandboxRestriction.InviteMember);

    const newWorkspace = await request(server())
      .post(`/api/v1/organizations/${workspace.organizationId}/workspaces`)
      .set('Cookie', cookie)
      .send({ name: 'Second store' });
    expectClaimRequired(newWorkspace, SandboxRestriction.CreateWorkspace);
  });

  it('claims with a new password once, after which the workspace is a normal one', async () => {
    const sandbox = await opened();
    const preview = await request(server())
      .post(`${CLAIMS}/preview`)
      .send({ token: sandbox.claimToken });
    expect(preview.body).toMatchObject({
      workspaceId: sandbox.workspaceId,
      email: sandbox.email,
      storeName: 'Ana Ceramics',
      passwordSet: false,
    });

    const claimed = await request(server())
      .post(CLAIMS)
      .send({ token: sandbox.claimToken, password: PASSWORD });
    expect(claimed.status).toBe(HttpStatus.OK);
    expect(claimed.body).toEqual({ workspaceId: sandbox.workspaceId, email: sandbox.email });
    const again = await request(server())
      .post(CLAIMS)
      .send({ token: sandbox.claimToken, password: PASSWORD });
    expect(again.status).toBe(HttpStatus.NOT_FOUND);

    const signIn = await request(server())
      .post(`${AUTH}/sign-in/email`)
      .send({ email: sandbox.email, password: PASSWORD });
    expect(signIn.status).toBe(HttpStatus.OK);
    expect(signIn.body.user.emailVerified).toBe(true);
    const cookie = [signIn.headers['set-cookie']].flat().join('; ');
    const me = await request(server()).get('/api/v1/me').set('Cookie', cookie);
    expect(me.body.workspaces).toEqual([
      expect.objectContaining({
        id: sandbox.workspaceId,
        sandbox: null,
        role: WorkspaceRole.OWNER,
      }),
    ]);

    const invite = await request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/invitations`)
      .set('Cookie', cookie)
      .send({ email: `${randomUUID()}@example.com`, role: WorkspaceRole.EDITOR });
    expect(invite.status).toBe(HttpStatus.CREATED);
    expect((await createProduct(sandbox, 'Kept by the agent')).status).toBe(HttpStatus.CREATED);
  });

  it('lets an owner who signed in claim from the app, which ends the link', async () => {
    const sandbox = await opened();
    const cookie = await signInByReset(sandbox.email);
    const preview = await request(server())
      .post(`${CLAIMS}/preview`)
      .send({ token: sandbox.claimToken });
    expect(preview.body.passwordSet).toBe(true);
    const withPassword = await request(server())
      .post(CLAIMS)
      .send({ token: sandbox.claimToken, password: PASSWORD });
    expect(withPassword.status).toBe(HttpStatus.CONFLICT);

    const asKey = await request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/sandbox/claim`)
      .set(API_KEY_HEADER, sandbox.apiKey);
    expect(asKey.status).toBe(HttpStatus.FORBIDDEN);
    const claimed = await request(server())
      .post(`/api/v1/workspaces/${sandbox.workspaceId}/sandbox/claim`)
      .set('Cookie', cookie);
    expect(claimed.status).toBe(HttpStatus.OK);

    const used = await request(server())
      .post(`${CLAIMS}/preview`)
      .send({ token: sandbox.claimToken });
    expect(used.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('reminds once with a new link after three days, and deletes unclaimed sandboxes after 14', async () => {
    const sweeper = app.get(SandboxSweeper, { strict: false });
    const sandbox = await opened();
    const reminderAt = new Date(Date.now() + SANDBOX_CLAIM_REMINDER_AFTER_MS + 60_000);

    expect((await sweeper.sweep(reminderAt)).reminded).toBeGreaterThanOrEqual(1);
    const reminder = await mail.lastTo(sandbox.email);
    expect(reminder.subject).toBe('Your Crossmart account is waiting to be claimed');
    const newToken = linkIn(reminder, 'http').searchParams.get('token');
    const oldLink = await request(server())
      .post(`${CLAIMS}/preview`)
      .send({ token: sandbox.claimToken });
    expect(oldLink.status).toBe(HttpStatus.NOT_FOUND);
    const newLink = await request(server()).post(`${CLAIMS}/preview`).send({ token: newToken });
    expect(newLink.status).toBe(HttpStatus.OK);
    const sentBefore = mail.sent.length;
    await sweeper.sweep(reminderAt);
    expect(mail.sent.length).toBe(sentBefore);

    const expiredAt = new Date(Date.now() + SANDBOX_TTL_MS + 60_000);
    expect((await sweeper.sweep(expiredAt)).deleted).toBeGreaterThanOrEqual(1);
    const gone = await request(server())
      .get(`/api/v1/workspaces/${sandbox.workspaceId}`)
      .set(API_KEY_HEADER, sandbox.apiKey);
    expect(gone.status).toBe(HttpStatus.UNAUTHORIZED);
    expect((await sweeper.sweep(expiredAt)).deleted).toBe(0);
    expect((await openSandbox(sandbox.email)).body.outcome).toBe(SandboxOpeningOutcome.Created);
  });
});
