import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { ApiKeyRepository } from './repositories/api-key.repository.js';
import { OrganizationRepository } from './repositories/organization.repository.js';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository.js';
import { WorkspaceRepository } from './repositories/workspace.repository.js';
import { ApiKeysService } from './services/api-keys.service.js';
import { TenancyProvisioningService } from './services/tenancy-provisioning.service.js';
import { WorkspaceAccessService } from './services/workspace-access.service.js';

/** Organizations, workspaces, members, roles and workspace API keys. */
@Module({
  imports: [ActivityModule],
  providers: [
    ApiKeyRepository,
    OrganizationRepository,
    WorkspaceMemberRepository,
    WorkspaceRepository,
    ApiKeysService,
    TenancyProvisioningService,
    WorkspaceAccessService,
  ],
  exports: [ApiKeysService, TenancyProvisioningService, WorkspaceAccessService],
})
export class TenancyModule {}
