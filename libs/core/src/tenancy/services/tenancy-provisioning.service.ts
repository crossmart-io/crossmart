import { Injectable, Logger } from '@nestjs/common';
import { slugify } from '@crossmart/common';
import { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import type { NewUser } from '../entities/new-user.js';
import { OrganizationRepository } from '../repositories/organization.repository.js';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { DEFAULT_WORKSPACE_NAME } from '../tenancy.constants.js';

/**
 * Gives every new user an organization on the default plan and a workspace they own, so they
 * can start at once.
 */
@Injectable()
export class TenancyProvisioningService {
  private readonly logger = new Logger(TenancyProvisioningService.name);

  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly members: WorkspaceMemberRepository,
    private readonly plans: OrganizationPlanService,
  ) {}

  async provisionForNewUser(user: NewUser): Promise<void> {
    if (await this.members.userHasAnyMembership(user.id)) {
      return;
    }
    const { workspaceId } = await this.organizations.createWithOwner({
      organizationName: this.organizationNameFor(user),
      workspaceName: DEFAULT_WORKSPACE_NAME,
      workspaceSlug: slugify(DEFAULT_WORKSPACE_NAME),
      ownerId: user.id,
      planVersionId: await this.plans.defaultPlanVersionId(),
    });
    this.logger.log(`Provisioned workspace ${workspaceId} for user ${user.id}`);
  }

  private organizationNameFor(user: NewUser): string {
    return user.name.trim() || user.email;
  }
}
