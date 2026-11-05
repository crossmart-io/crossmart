import { Injectable } from '@nestjs/common';
import type { ItemSpecific } from '@crossmart/connectors';
import { PrismaService } from '@crossmart/database';

/** The item specifics set on listings. Every query is scoped to the workspace. */
@Injectable()
export class ListingItemSpecificsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Replaces the listing's item specifics with `specifics`, at once. */
  async replace(workspaceId: string, listingId: string, specifics: ItemSpecific[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.listingItemSpecific.deleteMany({ where: { workspaceId, listingId } }),
      this.prisma.listingItemSpecific.createMany({
        data: specifics.map(({ name, values }) => ({ workspaceId, listingId, name, values })),
      }),
    ]);
  }
}
