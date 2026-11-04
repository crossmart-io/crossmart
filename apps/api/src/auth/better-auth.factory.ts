import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { AppConfigService } from '@crossmart/common';
import type { AccountEmailsService, NewUser } from '@crossmart/core';
import type { PrismaService } from '@crossmart/database';
import {
  AUTH_APP_NAME,
  AUTH_BASE_PATH,
  CLIENT_IP_HEADERS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth.constants.js';

export interface BetterAuthDependencies {
  appConfig: AppConfigService;
  prisma: PrismaService;
  onUserCreated: (user: NewUser) => Promise<void>;
  accountEmails: AccountEmailsService;
}

interface EmailUser {
  email: string;
  name: string;
}

/**
 * Better Auth configured for Crossmart: email and password with reset links and email checks,
 * UUID ids, our Prisma models. Email sending never blocks a response.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the inferred type carries Better Auth's option typings
export function createBetterAuth({
  appConfig,
  prisma,
  onUserCreated,
  accountEmails,
}: BetterAuthDependencies) {
  const toInput = (user: EmailUser, url: string): { to: string; name: string; url: string } => ({
    to: user.email,
    name: user.name,
    url,
  });
  return betterAuth({
    appName: AUTH_APP_NAME,
    baseURL: appConfig.authBaseUrl,
    basePath: AUTH_BASE_PATH,
    secret: appConfig.authSecret,
    trustedOrigins: appConfig.corsOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        Promise.resolve(accountEmails.sendPasswordReset(toInput(user, url))),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) =>
        Promise.resolve(accountEmails.sendEmailVerification(toInput(user, url))),
    },
    advanced: {
      database: { generateId: 'uuid' },
      ipAddress: { ipAddressHeaders: CLIENT_IP_HEADERS },
    },
    databaseHooks: { user: { create: { after: onUserCreated } } },
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
