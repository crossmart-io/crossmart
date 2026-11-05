import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AgentsModule, NotificationsModule, TenancyModule } from '@crossmart/core';
import { AuthenticationGuard } from './guards/authentication.guard.js';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard.js';
import { AgentAuthenticator } from './services/agent-authenticator.js';
import { AgentTokenVerifier } from './services/agent-token.verifier.js';
import { AuthTenancyHooks } from './services/auth-tenancy.hooks.js';
import { AuthService } from './services/auth.service.js';

/**
 * Sessions (Better Auth), API keys, agent access tokens and the global guards. Guards run in the
 * order listed.
 */
@Module({
  imports: [TenancyModule, NotificationsModule, AgentsModule],
  providers: [
    AuthService,
    AuthTenancyHooks,
    AgentTokenVerifier,
    AgentAuthenticator,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: WorkspaceAccessGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
