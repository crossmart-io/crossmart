import { Injectable } from '@nestjs/common';
import { findEnumValue } from '@crossmart/common';
import { PrismaService } from '@crossmart/database';
import {
  DEFAULT_OUTSIDE_AGENT_CHANGES,
  OutsideAgentChanges,
} from './enums/outside-agent-changes.enum.js';

/** The settings other features read from a workspace. */
export interface WorkspaceSettings {
  /** ISO 4217 code of the catalog's prices. */
  currency: string;
  /** IANA zone where the workspace's day starts, or null until someone sets it. */
  timeZone: string | null;
}

/** The stored value as the enum; an unknown one (a newer release's) requires approval. */
export function toOutsideAgentChanges(stored: string): OutsideAgentChanges {
  return findEnumValue(OutsideAgentChanges, stored) ?? DEFAULT_OUTSIDE_AGENT_CHANGES;
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

  /** Whether outside agents' changes wait for approval here (ADR 0028). */
  async outsideAgentChanges(workspaceId: string): Promise<OutsideAgentChanges> {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { outsideAgentChanges: true },
    });
    return toOutsideAgentChanges(workspace.outsideAgentChanges);
  }
}
