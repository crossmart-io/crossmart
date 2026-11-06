import { Injectable } from '@nestjs/common';
import { type NewUser, TenancyProvisioningService, WorkspaceAccessService } from '@crossmart/core';

/** What Better Auth needs to know about tenancy: new users get a workspace, and who is a member. */
@Injectable()
export class AuthTenancyHooks {
  constructor(
    private readonly provisioning: TenancyProvisioningService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  onUserCreated(user: NewUser): Promise<void> {
    return this.provisioning.provisionForNewUser(user);
  }

  async isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    return (await this.workspaceAccess.findRole(workspaceId, userId)) !== null;
  }
}
