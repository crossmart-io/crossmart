import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { AppConfigService } from '@crossmart/common';
import type { NewUser } from '@crossmart/core';
import type { PrismaService } from '@crossmart/database';
import { AUTH_APP_NAME, AUTH_BASE_PATH, MIN_PASSWORD_LENGTH } from './auth.constants.js';

export interface BetterAuthDependencies {
  appConfig: AppConfigService;
  prisma: PrismaService;
  onUserCreated: (user: NewUser) => Promise<void>;
}

/** Better Auth configured for Crossmart: email and password, UUID ids, our Prisma models. */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the inferred type carries Better Auth's option typings
export function createBetterAuth({ appConfig, prisma, onUserCreated }: BetterAuthDependencies) {
  return betterAuth({
    appName: AUTH_APP_NAME,
    baseURL: appConfig.authBaseUrl,
    basePath: AUTH_BASE_PATH,
    secret: appConfig.authSecret,
    trustedOrigins: appConfig.corsOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD_LENGTH },
    advanced: { database: { generateId: 'uuid' } },
    databaseHooks: { user: { create: { after: onUserCreated } } },
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
