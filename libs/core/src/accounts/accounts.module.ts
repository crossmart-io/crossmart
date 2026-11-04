import { Module } from '@nestjs/common';
import { ChannelsModule } from '../channels/channels.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AccountRepository } from './repositories/account.repository.js';
import { AccountDeletionService } from './services/account-deletion.service.js';
import { WorkspaceDeletionService } from './services/workspace-deletion.service.js';

/** Closing workspaces and accounts, with everything they hold. */
@Module({
  imports: [ChannelsModule, TenancyModule],
  providers: [AccountRepository, WorkspaceDeletionService, AccountDeletionService],
  exports: [WorkspaceDeletionService, AccountDeletionService],
})
export class AccountsModule {}
