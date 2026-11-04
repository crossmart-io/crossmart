import { Injectable } from '@nestjs/common';
import { PrismaService, type Workspace } from '@crossmart/database';

export interface WorkspaceWithOrganization extends Workspace {
  organization: { name: string };
}

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(workspaceId: string): Promise<WorkspaceWithOrganization | null> {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { organization: { select: { name: true } } },
    });
  }
}
