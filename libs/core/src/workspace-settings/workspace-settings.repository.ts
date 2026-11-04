import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';

/** The settings other features read from a workspace. */
export interface WorkspaceSettings {
  /** ISO 4217 code of the catalog's prices. */
  currency: string;
  /** IANA zone where the workspace's day starts, or null until someone sets it. */
  timeZone: string | null;
}

@Injectable()
export class WorkspaceSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  get(workspaceId: string): Promise<WorkspaceSettings> {
    return this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { currency: true, timeZone: true },
    });
  }
}
