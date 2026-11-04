import { Injectable } from '@nestjs/common';
import { type CustomRole, PrismaService } from '@crossmart/database';
import type { CustomRoleUsage } from '../entities/custom-role.js';
import type { StoredCustomRole } from '../entities/role-assignment.js';

export interface CustomRoleRecord {
  name: string;
  description: string | null;
  permissions: string[];
}

export type CustomRoleWithCount = CustomRole & { _count: { members: number } };

/** Prisma `select` for a relation to a custom role, with what resolving it needs. */
export const CUSTOM_ROLE_SELECT = {
  customRole: { select: { id: true, name: true, permissions: true } },
} as const;

const MEMBER_COUNT = { _count: { select: { members: true } } } as const;

@Injectable()
export class CustomRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(workspaceId: string): Promise<CustomRoleWithCount[]> {
    return this.prisma.customRole.findMany({
      where: { workspaceId },
      include: MEMBER_COUNT,
      orderBy: { name: 'asc' },
    });
  }

  find(workspaceId: string, customRoleId: string): Promise<StoredCustomRole | null> {
    return this.prisma.customRole.findFirst({
      where: { id: customRoleId, workspaceId },
      select: { id: true, name: true, permissions: true },
    });
  }

  async nameTaken(workspaceId: string, name: string, exceptId?: string): Promise<boolean> {
    const count = await this.prisma.customRole.count({
      where: {
        workspaceId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    return count > 0;
  }

  create(workspaceId: string, record: CustomRoleRecord): Promise<CustomRoleWithCount> {
    return this.prisma.customRole.create({
      data: { workspaceId, ...record },
      include: MEMBER_COUNT,
    });
  }

  update(customRoleId: string, record: CustomRoleRecord): Promise<CustomRoleWithCount> {
    return this.prisma.customRole.update({
      where: { id: customRoleId },
      data: record,
      include: MEMBER_COUNT,
    });
  }

  async delete(customRoleId: string): Promise<void> {
    await this.prisma.customRole.delete({ where: { id: customRoleId } });
  }

  async usage(customRoleId: string, now: Date): Promise<CustomRoleUsage> {
    const [members, pendingInvitations, activeApiKeys] = await Promise.all([
      this.prisma.workspaceMember.count({ where: { customRoleId } }),
      this.prisma.workspaceInvitation.count({
        where: { customRoleId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      }),
      this.prisma.apiKey.count({
        where: {
          customRoleId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      }),
    ]);
    return { members, pendingInvitations, activeApiKeys };
  }

  /** Users holding the role, whose API keys must stay within it. */
  async memberUserIds(customRoleId: string): Promise<string[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { customRoleId },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }
}
