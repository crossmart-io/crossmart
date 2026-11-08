import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@crossmart/common';
import {
  AgentProposalsStorageModule,
  AgentsModule,
  AgentWorkerStorageModule,
  EntitlementsModule,
  NotificationsModule,
  TenancyModule,
  WorkspaceSettingsModule,
} from '@crossmart/core';
import { AgentApprovalGuard } from '../agent-proposals/guards/agent-approval.guard.js';
import { SubscriptionWriteGuard } from '../billing/guards/subscription-write.guard.js';
import { BearerChallengeFilter } from './filters/bearer-challenge.filter.js';
import { AuthenticationGuard } from './guards/authentication.guard.js';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard.js';
import { RedisAuthRateLimitStorage } from './rate-limit/redis-auth-rate-limit.storage.js';
import { AgentAuthenticator } from './services/agent-authenticator.js';
import { AgentProposalAuthenticator } from './services/agent-proposal-authenticator.js';
import { AgentTokenVerifier } from './services/agent-token.verifier.js';
import { AgentWorkerAuthenticator } from './services/agent-worker-authenticator.js';
import { AuthTenancyHooks } from './services/auth-tenancy.hooks.js';
import { AuthService } from './services/auth.service.js';
import { BetterAuthServices } from './services/better-auth-services.js';
import { RequestCredentials } from './services/request-credentials.js';

/**
 * Sessions (Better Auth, with its rate limits in Redis), API keys, agent access tokens and the
 * global guards. Guards run in the order listed: who is calling, their access to the workspace,
 * whether a connected agent's write must be proposed instead (ADR 0028), then whether the
 * organization's subscription lets it change anything (ADR 0024). Every 401 points to where an
 * agent signs in (RFC 9728).
 */
@Module({
  imports: [
    RedisModule,
    TenancyModule,
    NotificationsModule,
    AgentsModule,
    AgentWorkerStorageModule,
    AgentProposalsStorageModule,
    WorkspaceSettingsModule,
    EntitlementsModule,
  ],
  providers: [
    RedisAuthRateLimitStorage,
    BetterAuthServices,
    AuthService,
    AuthTenancyHooks,
    AgentTokenVerifier,
    AgentAuthenticator,
    AgentWorkerAuthenticator,
    AgentProposalAuthenticator,
    RequestCredentials,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: WorkspaceAccessGuard },
    { provide: APP_GUARD, useClass: AgentApprovalGuard },
    { provide: APP_GUARD, useClass: SubscriptionWriteGuard },
    { provide: APP_FILTER, useClass: BearerChallengeFilter },
  ],
  exports: [AuthService],
})
export class AuthModule {}
