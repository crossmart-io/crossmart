import { Module } from '@nestjs/common';
import { AccountsModule, TenancyModule } from '@crossmart/core';
import { ApiKeysController } from './controllers/api-keys.controller.js';
import { CurrentApiKeyController } from './controllers/current-api-key.controller.js';
import { InvitationLinksController } from './controllers/invitation-links.controller.js';
import { InvitationsController } from './controllers/invitations.controller.js';
import { MeController } from './controllers/me.controller.js';
import { MembersController, MembershipController } from './controllers/members.controller.js';
import { WorkspacesController } from './controllers/workspaces.controller.js';

@Module({
  imports: [AccountsModule, TenancyModule],
  controllers: [
    MeController,
    WorkspacesController,
    MembersController,
    MembershipController,
    InvitationsController,
    InvitationLinksController,
    ApiKeysController,
    CurrentApiKeyController,
  ],
})
export class WorkspacesModule {}
