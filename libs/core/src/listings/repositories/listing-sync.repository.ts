import { Injectable } from '@nestjs/common';
import { ListingSource, ListingStatus, type Prisma, PrismaService } from '@crossmart/database';
import type { ListingVariantMapping } from '../../channels/repositories/listing.repository.js';
import type { ChannelListingQuery } from '../entities/listing-views.js';
import {
  LISTING_ROW_INCLUDE,
  LISTING_STOCK_INCLUDE,
  LISTING_SYNC_INCLUDE,
  type ListingPair,
  type ListingRowRecord,
  type ListingStockRecord,
  type ListingSyncRecord,
  onChannel,
} from './listing-sync.queries.js';

const OLDEST_FIRST = [
  { createdAt: 'asc' },
  { id: 'asc' },
] as const satisfies Prisma.ListingOrderByWithRelationInput[];

/** What a successful publish or update stores. */
export interface PublishedListingRecord {
  externalId: string;
  externalUrl: string | null;
  status: ListingStatus;
  variants: ListingVariantMapping[];
  mediaDigest: string;
  syncedAt: Date;
}

/**
 * Listings as the sync flow reads and writes them. A product may have several listings on one
 * connection; the sync works on its oldest one, the "primary" listing. Every query is scoped
 * to the workspace.
 */
@Injectable()
export class ListingSyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPrimary(
    workspaceId: string,
    connectionId: string,
    productId: string,
  ): Promise<ListingSyncRecord | null> {
    return this.prisma.listing.findFirst({
      where: { workspaceId, connectionId, productId },
      include: LISTING_SYNC_INCLUDE,
      orderBy: OLDEST_FIRST,
    });
  }

  /** Every listing of the product, oldest first, for its Channels card. */
  listForProduct(workspaceId: string, productId: string): Promise<ListingSyncRecord[]> {
    return this.prisma.listing.findMany({
      where: { workspaceId, productId },
      include: LISTING_SYNC_INCLUDE,
      orderBy: OLDEST_FIRST,
    });
  }

  /** The primary listing, created as pending when the product has none on the connection. */
  async ensurePrimary(
    workspaceId: string,
    connectionId: string,
    productId: string,
  ): Promise<ListingSyncRecord> {
    const existing = await this.findPrimary(workspaceId, connectionId, productId);
    if (existing) return existing;
    const { id } = await this.prisma.listing.create({
      data: { workspaceId, connectionId, productId, status: ListingStatus.PENDING },
      select: { id: true },
    });
    return this.prisma.listing.findUniqueOrThrow({ where: { id }, include: LISTING_SYNC_INCLUDE });
  }

  /** Pending listings for the products that have none on the connection yet. */
  async createPending(
    workspaceId: string,
    connectionId: string,
    productIds: string[],
  ): Promise<void> {
    const existing = await this.prisma.listing.findMany({
      where: { workspaceId, connectionId, productId: { in: productIds } },
      select: { productId: true },
    });
    const listed = new Set(existing.map((listing) => listing.productId));
    await this.prisma.listing.createMany({
      data: productIds
        .filter((productId) => !listed.has(productId))
        .map((productId) => ({
          workspaceId,
          connectionId,
          productId,
          status: ListingStatus.PENDING,
        })),
    });
  }

  /**
   * Keeps the products in the store until they are removed by hand: existing listings become
   * manual (delisted ones pending again), and products without one get a pending listing.
   */
  async addToStore(workspaceId: string, connectionId: string, productIds: string[]): Promise<void> {
    const scope = { workspaceId, connectionId, productId: { in: productIds } };
    await this.prisma.$transaction(async (tx) => {
      await tx.listing.updateMany({
        where: { ...scope, status: ListingStatus.DELISTED },
        data: { status: ListingStatus.PENDING, lastError: null },
      });
      await tx.listing.updateMany({ where: scope, data: { source: ListingSource.MANUAL } });
      const existing = await tx.listing.findMany({ where: scope, select: { productId: true } });
      const listed = new Set(existing.map((listing) => listing.productId));
      await tx.listing.createMany({
        data: productIds
          .filter((productId) => !listed.has(productId))
          .map((productId) => ({
            workspaceId,
            connectionId,
            productId,
            status: ListingStatus.PENDING,
            source: ListingSource.MANUAL,
          })),
      });
    });
  }

  /** Lets the products leave the store: their listings follow the automatic rule from now on. */
  async releaseFromStore(
    workspaceId: string,
    connectionId: string,
    productIds: string[],
  ): Promise<void> {
    await this.prisma.listing.updateMany({
      where: { workspaceId, connectionId, productId: { in: productIds } },
      data: { source: ListingSource.RULE },
    });
  }

  /** Stores the channel ids and status of a publish, and replaces the variant mappings, at once. */
  async recordPublished(listingId: string, record: PublishedListingRecord): Promise<void> {
    const { variants, syncedAt, ...fields } = record;
    await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.update({
        where: { id: listingId },
        data: { ...fields, lastSyncedAt: syncedAt, lastError: null },
        select: { workspaceId: true },
      });
      await tx.listingVariant.deleteMany({ where: { listingId } });
      await tx.listingVariant.createMany({
        data: variants.map((variant) => ({
          ...variant,
          listingId,
          workspaceId: listing.workspaceId,
        })),
      });
    });
  }

  /** A sync that only refreshed prices or stock. */
  async recordSynced(listingId: string, syncedAt: Date): Promise<void> {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { lastSyncedAt: syncedAt, lastError: null },
    });
  }

  /** Records why a sync failed. A publish failure also marks the listing as in error. */
  async recordFailure(listingId: string, lastError: string, status?: ListingStatus): Promise<void> {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { lastError, ...(status ? { status } : {}) },
    });
  }

  async markDelisted(listingId: string, syncedAt: Date): Promise<void> {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.DELISTED, lastSyncedAt: syncedAt, lastError: null },
    });
  }

  /** The primary listing with its variants' stock, when the channel holds it. */
  findPrimaryStock(
    workspaceId: string,
    connectionId: string,
    productId: string,
  ): Promise<ListingStockRecord | null> {
    return this.prisma.listing.findFirst({
      where: { workspaceId, connectionId, productId, ...onChannel() },
      include: LISTING_STOCK_INCLUDE,
      orderBy: OLDEST_FIRST,
    });
  }

  /** The connections that list each of these products, for syncing a catalog change. */
  findPairsForProducts(workspaceId: string, productIds: string[]): Promise<ListingPair[]> {
    return this.findPairs({ workspaceId, productId: { in: productIds } });
  }

  /** The listings that hold any of these stock items, for fanning out a stock change. */
  findPairsForInventoryItems(
    workspaceId: string,
    inventoryItemIds: string[],
  ): Promise<ListingPair[]> {
    return this.findPairs({
      workspaceId,
      variants: { some: { variant: { inventoryItem: { id: { in: inventoryItemIds } } } } },
    });
  }

  /** Products the connection lists now, for delisting and reconciliation. */
  /** Listings whose last sync failed, per store of the workspace. */
  async countFailedByConnection(workspaceId: string): Promise<Map<string, number>> {
    const groups = await this.prisma.listing.groupBy({
      by: ['connectionId'],
      where: { workspaceId, status: ListingStatus.ERROR },
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.connectionId, group._count._all]));
  }

  async listProductIdsOnChannel(workspaceId: string, connectionId: string): Promise<string[]> {
    const pairs = await this.findPairs({ workspaceId, connectionId });
    return pairs.map((pair) => pair.productId);
  }

  listPage(
    workspaceId: string,
    connectionId: string,
    query: ChannelListingQuery,
  ): Promise<ListingRowRecord[]> {
    return this.prisma.listing.findMany({
      where: { workspaceId, connectionId, ...(query.status ? { status: query.status } : {}) },
      include: LISTING_ROW_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
  }

  private async findPairs(where: Prisma.ListingWhereInput): Promise<ListingPair[]> {
    return this.prisma.listing.findMany({
      where: { ...where, ...onChannel() },
      select: { connectionId: true, productId: true },
      distinct: ['connectionId', 'productId'],
    });
  }
}
