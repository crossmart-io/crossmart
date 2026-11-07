import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@crossmart/common';
import {
  AgentsModule,
  EntitlementsModule,
  NotificationsModule,
  TenancyModule,
} from '@crossmart/core';
import { SubscriptionWriteGuard } from '../billing/guards/subscription-write.guard.js';
import { AuthenticationGuard } from './guards/authentication.guard.js';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard.js';
import { RedisAuthRateLimitStorage } from './rate-limit/redis-auth-rate-limit.storage.js';
import { AgentAuthenticator } from './services/agent-authenticator.js';
import { AgentTokenVerifier } from './services/agent-token.verifier.js';
import { AuthTenancyHooks } from './services/auth-tenancy.hooks.js';
import { AuthService } from './services/auth.service.js';
import { BetterAuthServices } from './services/better-auth-services.js';

/**
 * Sessions (Better Auth, with its rate limits in Redis), API keys, agent access tokens and the
 * global guards. Guards run in the order listed: who is calling, their access to the workspace,
 * then whether the organization's subscription lets it change anything (ADR 0024).
 */
@Module({
  imports: [RedisModule, TenancyModule, NotificationsModule, AgentsModule, EntitlementsModule],
  providers: [
    RedisAuthRateLimitStorage,
    BetterAuthServices,
    AuthService,
    AuthTenancyHooks,
    AgentTokenVerifier,
    AgentAuthenticator,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: WorkspaceAccessGuard },
    { provide: APP_GUARD, useClass: SubscriptionWriteGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
