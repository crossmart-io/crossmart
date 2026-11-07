import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService, WorkspaceRole } from '@crossmart/database';

export interface NewOrganizationWithOwner {
  organizationName: string;
  workspaceName: string;
  workspaceSlug: string;
  ownerId: string;
  /** The plan version the organization starts on. */
  planVersionId: string;
}

/** The organization with its subscription, its first workspace and the owner's membership. */
export function organizationWithOwnerData(
  input: NewOrganizationWithOwner,
): Prisma.OrganizationCreateInput {
  return {
    name: input.organizationName,
    subscription: { create: { planVersionId: input.planVersionId } },
    workspaces: {
      create: {
        name: input.workspaceName,
        slug: input.workspaceSlug,
        members: { create: { userId: input.ownerId, role: WorkspaceRole.OWNER } },
      },
    },
  };
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the organization with its subscription, its first workspace and the owner's
   * membership in one write.
   */
  async createWithOwner(input: NewOrganizationWithOwner): Promise<{ workspaceId: string }> {
    const organization = await this.prisma.organization.create({
      data: organizationWithOwnerData(input),
      select: { workspaces: { select: { id: true } } },
    });
    const [workspace] = organization.workspaces;
    return { workspaceId: workspace.id };
  }
}
