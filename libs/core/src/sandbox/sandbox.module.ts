import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SandboxAccountRepository } from './repositories/sandbox-account.repository.js';
import { SandboxClaimRepository } from './repositories/sandbox-claim.repository.js';
import { SandboxSweepRepository } from './repositories/sandbox-sweep.repository.js';
import { SandboxAccountsService } from './services/sandbox-accounts.service.js';
import { SandboxClaimMailer } from './services/sandbox-claim.mailer.js';
import { SandboxClaimsService } from './services/sandbox-claims.service.js';
import { SandboxSweeper } from './services/sandbox-sweeper.js';

/**
 * Sandbox accounts AI agents open for people without an account (ADR 0019): opening them,
 * claiming them, and the sweep that reminds and deletes. What a sandbox may not do is
 * `EntitlementService`'s to answer.
 */
@Module({
  imports: [ActivityModule, EntitlementsModule, NotificationsModule],
  providers: [
    SandboxAccountRepository,
    SandboxClaimRepository,
    SandboxSweepRepository,
    SandboxClaimMailer,
    SandboxAccountsService,
    SandboxClaimsService,
    SandboxSweeper,
  ],
  exports: [SandboxAccountsService, SandboxClaimsService, SandboxSweeper],
})
export class SandboxModule {}
