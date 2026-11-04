import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ApiKeyRepository } from './repositories/api-key.repository.js';
import { OrganizationRepository } from './repositories/organization.repository.js';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository.js';
import { WorkspaceInvitationRepository } from './repositories/workspace-invitation.repository.js';
import { WorkspaceRepository } from './repositories/workspace.repository.js';
import { ApiKeysService } from './services/api-keys.service.js';
import { InvitationMailer } from './services/invitation-mailer.js';
import { InvitationsService } from './services/invitations.service.js';
import { MembershipService } from './services/membership.service.js';
import { TenancyProvisioningService } from './services/tenancy-provisioning.service.js';
import { WorkspaceAccessService } from './services/workspace-access.service.js';

/** Organizations, workspaces, members, invitations, roles and workspace API keys. */
@Module({
  imports: [ActivityModule, NotificationsModule],
  providers: [
    ApiKeyRepository,
    OrganizationRepository,
    WorkspaceMemberRepository,
    WorkspaceInvitationRepository,
    WorkspaceRepository,
    ApiKeysService,
    InvitationMailer,
    InvitationsService,
    MembershipService,
    TenancyProvisioningService,
    WorkspaceAccessService,
  ],
  exports: [
    ApiKeysService,
    InvitationsService,
    MembershipService,
    TenancyProvisioningService,
    WorkspaceAccessService,
  ],
})
export class TenancyModule {}
