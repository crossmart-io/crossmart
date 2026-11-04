import { Injectable } from '@nestjs/common';
import { PrismaService, type Workspace, WorkspaceRole } from '@crossmart/database';

export interface WorkspaceWithOrganization extends Workspace {
  organization: { name: string };
}

export interface NewWorkspace {
  organizationId: string;
  name: string;
  slug: string;
  currency: string;
  timeZone: string | null;
  ownerId: string;
}

const ORGANIZATION_NAME = { organization: { select: { name: true } } } as const;

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(workspaceId: string): Promise<WorkspaceWithOrganization | null> {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: ORGANIZATION_NAME,
    });
  }

  countInOrganization(organizationId: string): Promise<number> {
    return this.prisma.workspace.count({ where: { organizationId } });
  }

  /** The slugs in the organization that start with `base`, to pick a free one. */
  async slugsLike(organizationId: string, base: string): Promise<string[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { organizationId, slug: { startsWith: base } },
      select: { slug: true },
    });
    return workspaces.map((workspace) => workspace.slug);
  }

  /** True when the user owns at least one workspace of the organization. */
  async isOrganizationOwner(organizationId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({
      where: { userId, role: WorkspaceRole.OWNER, workspace: { organizationId } },
    });
    return count > 0;
  }

  /** The workspace with its creator as owner, in one write. */
  create(input: NewWorkspace): Promise<WorkspaceWithOrganization> {
    const { ownerId, ...workspace } = input;
    return this.prisma.workspace.create({
      data: { ...workspace, members: { create: { userId: ownerId, role: WorkspaceRole.OWNER } } },
      include: ORGANIZATION_NAME,
    });
  }

  update(
    workspaceId: string,
    changes: { name?: string; timeZone?: string },
  ): Promise<WorkspaceWithOrganization> {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: changes,
      include: ORGANIZATION_NAME,
    });
  }
}
