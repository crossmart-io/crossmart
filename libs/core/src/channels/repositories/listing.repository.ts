import { Injectable } from '@nestjs/common';
import {
  type Listing,
  type ListingStatus,
  type ListingVariant,
  type Prisma,
  PrismaService,
} from '@crossmart/database';

export interface ListingVariantMapping {
  variantId: string;
  externalId: string;
  externalInventoryId: string | null;
}

/** What import and publish record once the channel holds a product. */
export interface ListingRecord {
  workspaceId: string;
  connectionId: string;
  productId: string;
  externalId: string;
  externalUrl: string | null;
  status: ListingStatus;
  variants: ListingVariantMapping[];
  syncedAt: Date;
}

export type ListingWithVariants = Listing & { variants: ListingVariant[] };

/**
 * Listings and their variant id mappings. A product may hold several listings on one
 * connection, so listings are found by their external id, which is unique per connection.
 */
@Injectable()
export class ListingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByExternalId(connectionId: string, externalId: string): Promise<ListingWithVariants | null> {
    return this.prisma.listing.findUnique({
      where: { connectionId_externalId: { connectionId, externalId } },
      include: { variants: true },
    });
  }

  listForProduct(workspaceId: string, productId: string): Promise<ListingWithVariants[]> {
    return this.prisma.listing.findMany({
      where: { workspaceId, productId },
      include: { variants: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** The connection's listings with these external ids, in one query. */
  findManyByExternalIds(
    connectionId: string,
    externalIds: string[],
  ): Promise<ListingWithVariants[]> {
    return this.prisma.listing.findMany({
      where: { connectionId, externalId: { in: externalIds } },
      include: { variants: true },
    });
  }

  /** Which of these products already have a listing on the connection, with its external id. */
  async findExternalIdsByProduct(
    connectionId: string,
    productIds: string[],
  ): Promise<Map<string, string | null>> {
    const rows = await this.prisma.listing.findMany({
      where: { connectionId, productId: { in: productIds } },
      select: { productId: true, externalId: true },
    });
    return new Map(rows.map((row) => [row.productId, row.externalId]));
  }

  /** Products of the connection's listings synced at or after `since`, such as by an import. */
  async findProductIdsSyncedSince(connectionId: string, since: Date): Promise<string[]> {
    const rows = await this.prisma.listing.findMany({
      where: { connectionId, lastSyncedAt: { gte: since } },
      select: { productId: true },
      distinct: ['productId'],
    });
    return rows.map((row) => row.productId);
  }

  /** Creates or updates the listing with this external id and replaces its variant mappings. */
  upsertByExternalId(record: ListingRecord): Promise<ListingWithVariants> {
    return this.toUpsert(record);
  }

  /** Upserts many listings in one transaction: all of them or none. */
  async upsertManyByExternalId(records: ListingRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.prisma.$transaction(records.map((record) => this.toUpsert(record)));
  }

  private toUpsert(record: ListingRecord): Prisma.PrismaPromise<ListingWithVariants> {
    const { variants, syncedAt, ...listing } = record;
    const fields = { ...listing, lastSyncedAt: syncedAt, lastError: null };
    const variantRows = variants.map((variant) => ({
      ...variant,
      workspaceId: listing.workspaceId,
    }));
    return this.prisma.listing.upsert({
      where: {
        connectionId_externalId: {
          connectionId: listing.connectionId,
          externalId: listing.externalId,
        },
      },
      create: { ...fields, variants: { createMany: { data: variantRows } } },
      update: { ...fields, variants: { deleteMany: {}, createMany: { data: variantRows } } },
      include: { variants: true },
    });
  }

  async markFailed(listingId: string, status: ListingStatus, lastError: string): Promise<void> {
    await this.prisma.listing.update({ where: { id: listingId }, data: { status, lastError } });
  }
}
