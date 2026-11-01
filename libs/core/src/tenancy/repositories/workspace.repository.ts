import { Injectable } from '@nestjs/common';
import { PrismaService, type Workspace } from '@crossmart/database';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(workspaceId: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({ where: { id: workspaceId } });
  }
}
