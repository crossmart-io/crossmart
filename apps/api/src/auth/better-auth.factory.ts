import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { AppConfigService } from '@crossmart/common';
import type { AccountEmailsService, NewUser } from '@crossmart/core';
import type { PrismaService } from '@crossmart/database';
import {
  AGENT_OAUTH_SESSION_FIELDS,
  agentOAuthPlugins,
  publicClientRegistrationOnly,
  type WorkspaceMembershipCheck,
} from './agent-oauth.options.js';
import {
  AUTH_APP_NAME,
  AUTH_BASE_PATH,
  CLIENT_IP_HEADERS,
  MIN_PASSWORD_LENGTH,
  OAUTH_REGISTER_PATH,
  OAUTH_REGISTER_RATE_LIMIT,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth.constants.js';

export interface BetterAuthDependencies {
  appConfig: AppConfigService;
  prisma: PrismaService;
  onUserCreated: (user: NewUser) => Promise<void>;
  accountEmails: AccountEmailsService;
  isWorkspaceMember: WorkspaceMembershipCheck;
}

interface EmailUser {
  email: string;
  name: string;
}

function toEmailInput(user: EmailUser, url: string): { to: string; name: string; url: string } {
  return { to: user.email, name: user.name, url };
}

/** Email and password sign-in, with reset links and address checks sent in the background. */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the inferred type carries Better Auth's option typings
function emailAuthOptions(accountEmails: AccountEmailsService) {
  return {
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      resetPasswordTokenExpiresIn: PASSWORD_RESET_TTL_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }: { user: EmailUser; url: string }) =>
        Promise.resolve(accountEmails.sendPasswordReset(toEmailInput(user, url))),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }: { user: EmailUser; url: string }) =>
        Promise.resolve(accountEmails.sendEmailVerification(toEmailInput(user, url))),
    },
  };
}

/**
 * Better Auth configured for Crossmart: email and password with reset links and email checks,
 * UUID ids, our Prisma models, and the OAuth server AI agents sign in through (ADR 0019).
 * Email sending never blocks a response.
 */
// oxlint-disable-next-line typescript/explicit-function-return-type -- the inferred type carries Better Auth's option typings
export function createBetterAuth({
  appConfig,
  prisma,
  onUserCreated,
  accountEmails,
  isWorkspaceMember,
}: BetterAuthDependencies) {
  return betterAuth({
    appName: AUTH_APP_NAME,
    baseURL: appConfig.authBaseUrl,
    basePath: AUTH_BASE_PATH,
    secret: appConfig.authSecret,
    trustedOrigins: appConfig.corsOrigins,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    ...emailAuthOptions(accountEmails),
    session: { additionalFields: AGENT_OAUTH_SESSION_FIELDS },
    plugins: agentOAuthPlugins(appConfig, isWorkspaceMember),
    hooks: { before: publicClientRegistrationOnly },
    rateLimit: { customRules: { [OAUTH_REGISTER_PATH]: OAUTH_REGISTER_RATE_LIMIT } },
    advanced: {
      database: { generateId: 'uuid' },
      ipAddress: { ipAddressHeaders: CLIENT_IP_HEADERS },
    },
    databaseHooks: { user: { create: { after: onUserCreated } } },
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
