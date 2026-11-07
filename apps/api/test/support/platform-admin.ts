import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import { PrismaService } from '@crossmart/database';
import { signUp, type SignedUpUser } from './test-app.js';

/** Signs up the platform admin named in `PLATFORM_ADMIN_EMAILS`, with a verified address. */
export async function signUpPlatformAdmin(
  app: INestApplication<App>,
  email: string,
): Promise<SignedUpUser> {
  const admin = await signUp(app, 'Platform Admin', email);
  await app.get(PrismaService).user.update({ where: { email }, data: { emailVerified: true } });
  return admin;
}
