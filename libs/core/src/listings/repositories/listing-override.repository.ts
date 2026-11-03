import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { ListingOverrideInput } from '../entities/listing-override.js';

/** A listing's overrides: one row of content and stock limits, and one row per fixed price. */
@Injectable()
export class ListingOverrideRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Replaces the listing's overrides; variants without a price or compare-at get no row. */
  async replace(
    workspaceId: string,
    listingId: string,
    input: ListingOverrideInput,
  ): Promise<void> {
    const { variantPrices, tags, mediaUrls, ...fields } = input;
    const content = {
      ...fields,
      tagsOverridden: tags !== null,
      tags: tags ?? [],
      mediaOverridden: mediaUrls !== null,
      mediaUrls: mediaUrls ?? [],
    };
    const prices = variantPrices.filter((entry) => entry.price || entry.compareAtPrice);
    await this.prisma.$transaction(async (tx) => {
      await tx.listingOverride.upsert({
        where: { listingId },
        create: { workspaceId, listingId, ...content },
        update: content,
      });
      await tx.listingVariantOverride.deleteMany({ where: { listingId } });
      if (prices.length > 0) {
        await tx.listingVariantOverride.createMany({
          data: prices.map((entry) => ({ workspaceId, listingId, ...entry })),
        });
      }
    });
  }

  async clear(workspaceId: string, listingId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.listingOverride.deleteMany({ where: { workspaceId, listingId } });
      await tx.listingVariantOverride.deleteMany({ where: { workspaceId, listingId } });
    });
  }
}
