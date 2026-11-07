import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ApiModule } from '../../src/api.module.js';
import { configureApplication } from '../../src/bootstrap/configure-application.js';

export const TEST_PASSWORD = 'correct-horse-battery';
const SET_COOKIE_HEADER = 'set-cookie';

export interface SignedUpUser {
  email: string;
  cookie: string;
  workspaceId: string;
}

/** Replaces providers before the app starts, such as the HTTP transport channels use. */
export type TestModuleOverrides = (builder: TestingModuleBuilder) => TestingModuleBuilder;

/** The API with the same HTTP conventions as the running server. */
export async function createTestApp(
  overrides: TestModuleOverrides = (builder) => builder,
): Promise<INestApplication<App>> {
  const moduleRef = await overrides(Test.createTestingModule({ imports: [ApiModule] })).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({ rawBody: true });
  configureApplication(app);
  await app.init();
  return app;
}

/** Signs up a fresh user and returns their session cookie and first workspace. */
export async function signUp(
  app: INestApplication<App>,
  name: string,
  email = `${randomUUID()}@example.com`,
): Promise<SignedUpUser> {
  const signUpResponse = await request(app.getHttpServer())
    .post('/api/auth/sign-up/email')
    .send({ name, email, password: TEST_PASSWORD });
  expect(signUpResponse.status).toBe(HttpStatus.OK);
  const cookie = [signUpResponse.headers[SET_COOKIE_HEADER]].flat().join('; ');

  const meResponse = await request(app.getHttpServer()).get('/api/v1/me').set('Cookie', cookie);
  expect(meResponse.status).toBe(HttpStatus.OK);
  return { email, cookie, workspaceId: meResponse.body.workspaces[0].id };
}

const COOKIE_ATTRIBUTES_SEPARATOR = ';';

/**
 * The user's session cookie plus the cookies `response` set, as their browser would send them
 * next, such as the OAuth nonce cookie set when a channel connection starts.
 */
export function browserCookies(user: SignedUpUser, response: request.Response): string {
  const set = [response.headers[SET_COOKIE_HEADER] ?? []].flat() as string[];
  const pairs = set.map((cookie) => cookie.split(COOKIE_ATTRIBUTES_SEPARATOR)[0]);
  return [user.cookie, ...pairs].join('; ');
}
