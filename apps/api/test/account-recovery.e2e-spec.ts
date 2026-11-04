import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { MailSender } from '@crossmart/common';
import { linkIn, RecordingMailSender } from './support/recording-mail.sender.js';
import { createTestApp, TEST_PASSWORD } from './support/test-app.js';

const AUTH = '/api/auth';
const WEB_RESET_PAGE = 'http://localhost:5179/reset-password';
const NEW_PASSWORD = 'a-brand-new-password';

describe('Account recovery (e2e)', () => {
  let app: INestApplication<App>;
  const mail = new RecordingMailSender();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(MailSender).useValue(mail));
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function signUpWithEmail(): Promise<{ email: string; cookie: string }> {
    const email = `${randomUUID()}@example.com`;
    const response = await request(server())
      .post(`${AUTH}/sign-up/email`)
      .send({ name: 'Rosa', email, password: TEST_PASSWORD });
    expect(response.status).toBe(HttpStatus.OK);
    return { email, cookie: [response.headers['set-cookie']].flat().join('; ') };
  }

  it('emails a confirmation link on sign-up that verifies the address', async () => {
    const { email } = await signUpWithEmail();
    const message = await mail.lastTo(email);
    expect(message.subject).toBe('Confirm your email for Crossmart');

    const link = linkIn(message, 'http');
    const verified = await request(server()).get(`${link.pathname}${link.search}`);
    expect(verified.status).toBeLessThan(HttpStatus.BAD_REQUEST);

    const signIn = await request(server())
      .post(`${AUTH}/sign-in/email`)
      .send({ email, password: TEST_PASSWORD });
    expect(signIn.body.user.emailVerified).toBe(true);
  });

  it('resets a forgotten password through the emailed link and signs out old sessions', async () => {
    const { email, cookie } = await signUpWithEmail();
    const asked = await request(server())
      .post(`${AUTH}/request-password-reset`)
      .send({ email, redirectTo: WEB_RESET_PAGE });
    expect(asked.status).toBe(HttpStatus.OK);

    const message = await mail.lastTo(email);
    expect(message.subject).toBe('Reset your Crossmart password');
    const link = linkIn(message, 'http');
    const opened = await request(server()).get(`${link.pathname}${link.search}`);
    const redirect = new URL(opened.headers.location);
    expect(`${redirect.origin}${redirect.pathname}`).toBe(WEB_RESET_PAGE);
    const token = redirect.searchParams.get('token');

    const reset = await request(server())
      .post(`${AUTH}/reset-password`)
      .send({ token, newPassword: NEW_PASSWORD });
    expect(reset.status).toBe(HttpStatus.OK);

    const oldSession = await request(server()).get('/api/v1/me').set('Cookie', cookie);
    expect(oldSession.status).toBe(HttpStatus.UNAUTHORIZED);
    const withNewPassword = await request(server())
      .post(`${AUTH}/sign-in/email`)
      .send({ email, password: NEW_PASSWORD });
    expect(withNewPassword.status).toBe(HttpStatus.OK);
  });

  it('answers the same for an unknown address and sends nothing', async () => {
    const before = mail.sent.length;
    const response = await request(server())
      .post(`${AUTH}/request-password-reset`)
      .send({ email: `${randomUUID()}@example.com`, redirectTo: WEB_RESET_PAGE });
    expect(response.status).toBe(HttpStatus.OK);
    expect(mail.sent.length).toBe(before);
  });
});
