import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import { CUSTOM_ROLE_SELECT } from '../../tenancy/repositories/custom-role.repository.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { resolveRole } from '../../tenancy/permissions/role-permissions.js';

/** A workspace and the people told about its webhooks. */
export interface WebhookAudience {
  workspaceName: string;
  emails: string[];
}

/** Who hears about a workspace's webhook endpoints: the members who may manage them. */
@Injectable()
export class WebhookRecipientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAudience(workspaceId: string): Promise<WebhookAudience | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        members: {
          select: { role: true, ...CUSTOM_ROLE_SELECT, user: { select: { email: true } } },
        },
      },
    });
    if (!workspace) return null;
    const emails = workspace.members
      .filter(({ role, customRole }) =>
        resolveRole(role, customRole).permissions.has(WorkspacePermission.ManageWebhooks),
      )
      .map((member) => member.user.email);
    return { workspaceName: workspace.name, emails };
  }
}
