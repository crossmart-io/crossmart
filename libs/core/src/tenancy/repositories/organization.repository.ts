import { Injectable } from '@nestjs/common';
import { PrismaService, WorkspaceRole } from '@crossmart/database';

export interface NewOrganizationWithOwner {
  organizationName: string;
  workspaceName: string;
  workspaceSlug: string;
  ownerId: string;
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the organization, its first workspace and the owner's membership in one write. */
  async createWithOwner(input: NewOrganizationWithOwner): Promise<{ workspaceId: string }> {
    const organization = await this.prisma.organization.create({
      data: {
        name: input.organizationName,
        workspaces: {
          create: {
            name: input.workspaceName,
            slug: input.workspaceSlug,
            members: { create: { userId: input.ownerId, role: WorkspaceRole.OWNER } },
          },
        },
      },
      select: { workspaces: { select: { id: true } } },
    });
    const [workspace] = organization.workspaces;
    return { workspaceId: workspace.id };
  }
}
