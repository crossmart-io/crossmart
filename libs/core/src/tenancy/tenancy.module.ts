import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ApiKeyRepository } from './repositories/api-key.repository.js';
import { CustomRoleRepository } from './repositories/custom-role.repository.js';
import { OrganizationRepository } from './repositories/organization.repository.js';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository.js';
import { WorkspaceInvitationRepository } from './repositories/workspace-invitation.repository.js';
import { WorkspaceRepository } from './repositories/workspace.repository.js';
import { ApiKeyCleanup } from './services/api-key-cleanup.js';
import { ApiKeysService } from './services/api-keys.service.js';
import { CustomRolesService } from './services/custom-roles.service.js';
import { InvitationMailer } from './services/invitation-mailer.js';
import { InvitationsService } from './services/invitations.service.js';
import { MembershipService } from './services/membership.service.js';
import { RoleResolver } from './services/role-resolver.js';
import { TenancyProvisioningService } from './services/tenancy-provisioning.service.js';
import { WorkspaceAccessService } from './services/workspace-access.service.js';

/** Organizations, workspaces, members, invitations, roles and workspace API keys. */
@Module({
  imports: [ActivityModule, NotificationsModule],
  providers: [
    ApiKeyRepository,
    CustomRoleRepository,
    OrganizationRepository,
    WorkspaceMemberRepository,
    WorkspaceInvitationRepository,
    WorkspaceRepository,
    ApiKeyCleanup,
    ApiKeysService,
    CustomRolesService,
    InvitationMailer,
    InvitationsService,
    MembershipService,
    RoleResolver,
    TenancyProvisioningService,
    WorkspaceAccessService,
  ],
  exports: [
    ApiKeysService,
    CustomRolesService,
    InvitationsService,
    MembershipService,
    TenancyProvisioningService,
    WorkspaceAccessService,
  ],
})
export class TenancyModule {}
