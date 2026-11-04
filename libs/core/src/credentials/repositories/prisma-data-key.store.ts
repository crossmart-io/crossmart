import { Injectable } from '@nestjs/common';
import { DataKeyStore, type WrappedDataKey } from '@crossmart/common';
import { PrismaService } from '@crossmart/database';

const WRAPPED_KEY_SELECT = { wrappedKey: true, masterKeyVersion: true } as const;

/** Wrapped workspace data keys in `workspace_data_keys`. Plain keys never reach the database. */
@Injectable()
export class PrismaDataKeyStore extends DataKeyStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  find(workspaceId: string): Promise<WrappedDataKey | null> {
    return this.prisma.workspaceDataKey.findUnique({
      where: { workspaceId },
      select: WRAPPED_KEY_SELECT,
    });
  }

  /** `createMany` with `skipDuplicates` is an insert that loses a race quietly. */
  async insertIfAbsent(workspaceId: string, key: WrappedDataKey): Promise<WrappedDataKey> {
    await this.prisma.workspaceDataKey.createMany({
      data: [{ workspaceId, ...key }],
      skipDuplicates: true,
    });
    return this.prisma.workspaceDataKey.findUniqueOrThrow({
      where: { workspaceId },
      select: WRAPPED_KEY_SELECT,
    });
  }

  async replace(workspaceId: string, key: WrappedDataKey): Promise<void> {
    await this.prisma.workspaceDataKey.update({ where: { workspaceId }, data: key });
  }
}
