import { type CountedRecords, toPageWindow } from '@crossmart/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChannelCategory, PublishRequirement } from '@crossmart/connectors';
import { ListingSource, ListingStatus, type Prisma, PrismaService } from '@crossmart/database';
import type { ListingVariantMapping } from '../../channels/repositories/listing.repository.js';
import type { ChannelListingQuery } from '../entities/listing-views.js';
import { LISTING_NOT_FOUND, RETRYABLE_LISTING_STATUSES } from '../listings.constants.js';
import {
  LISTING_ROW_INCLUDE,
  LISTING_STOCK_INCLUDE,
  LISTING_SYNC_INCLUDE,
  type HeldListing,
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

/** A listing to write to, always within its workspace. */
export interface ListingRef {
  workspaceId: string;
  listingId: string;
}

/** What a successful publish or update stores. */
export interface PublishedListingRecord {
  externalId: string;
  externalUrl: string | null;
  status: ListingStatus;
  variants: ListingVariantMapping[];
  mediaDigest: string;
  syncedAt: Date;
  /** The channel category it was listed in; absent keeps the stored one. */
  channelCategoryId?: string;
  channelCategoryName?: string;
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
    return this.prisma.listing.findUniqueOrThrow({
      where: { id, workspaceId },
      include: LISTING_SYNC_INCLUDE,
    });
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
        data: { status: ListingStatus.PENDING, lastError: null, missingRequirement: null },
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

  /**
   * Stores the channel ids and status of a publish, and replaces the variant mappings, at once.
   * Throws when the listing is not in the workspace (or was deleted meanwhile).
   */
  async recordPublished(listing: ListingRef, record: PublishedListingRecord): Promise<void> {
    const { variants, syncedAt, ...fields } = record;
    const { workspaceId, listingId } = listing;
    await this.prisma.$transaction(async (tx) => {
      await this.updateListing(tx, listing, {
        ...fields,
        lastSyncedAt: syncedAt,
        lastError: null,
        missingRequirement: null,
      });
      await tx.listingVariant.deleteMany({ where: { listingId, workspaceId } });
      await tx.listingVariant.createMany({
        data: variants.map((variant) => ({ ...variant, listingId, workspaceId })),
      });
    });
  }

  /** Puts the listing in a channel category; null lets the next publish pick one. */
  async saveCategory(listing: ListingRef, category: ChannelCategory | null): Promise<void> {
    await this.updateListing(this.prisma, listing, {
      channelCategoryId: category?.id ?? null,
      channelCategoryName: category?.name ?? null,
    });
  }

  /** A sync that only refreshed prices or stock. */
  async recordSynced(listing: ListingRef, syncedAt: Date): Promise<void> {
    await this.updateListing(this.prisma, listing, { lastSyncedAt: syncedAt, lastError: null });
  }

  /**
   * Records why a sync failed. A publish failure also marks the listing as in error, with what
   * it was refused for lacking when the merchant can add that.
   */
  async recordFailure(
    listing: ListingRef,
    lastError: string,
    status?: ListingStatus,
    missingRequirement: PublishRequirement | null = null,
  ): Promise<void> {
    await this.updateListing(this.prisma, listing, {
      lastError,
      ...(status ? { status, missingRequirement } : {}),
    });
  }

  /**
   * Queues the listing to be published again: a failed or delisted one is pending once more,
   * its error cleared. A listing on the channel keeps its status while it is updated.
   */
  async markForRetry(listing: ListingRef): Promise<void> {
    await this.prisma.listing.updateMany({
      where: {
        id: listing.listingId,
        workspaceId: listing.workspaceId,
        status: { in: [...RETRYABLE_LISTING_STATUSES] },
      },
      data: { status: ListingStatus.PENDING, lastError: null, missingRequirement: null },
    });
  }

  async markDelisted(listing: ListingRef, syncedAt: Date): Promise<void> {
    await this.updateListing(this.prisma, listing, {
      status: ListingStatus.DELISTED,
      lastSyncedAt: syncedAt,
      lastError: null,
      missingRequirement: null,
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

  /** The listings channels hold for these products, read before the products are deleted. */
  async findHeldForProducts(workspaceId: string, productIds: string[]): Promise<HeldListing[]> {
    const listings = await this.prisma.listing.findMany({
      where: { workspaceId, productId: { in: productIds }, ...onChannel() },
      select: {
        connectionId: true,
        productId: true,
        externalId: true,
        product: { select: { title: true } },
        variants: { select: { externalId: true } },
      },
    });
    return listings.flatMap(({ externalId, product, variants, ...pair }) =>
      externalId
        ? [
            {
              ...pair,
              externalId,
              productTitle: product.title,
              variantExternalIds: variants.map((variant) => variant.externalId),
            },
          ]
        : [],
    );
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

  async listPage(
    workspaceId: string,
    connectionId: string,
    query: ChannelListingQuery,
  ): Promise<CountedRecords<ListingRowRecord>> {
    const where: Prisma.ListingWhereInput = {
      workspaceId,
      connectionId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: LISTING_ROW_INCLUDE,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        ...toPageWindow(query),
      }),
      this.prisma.listing.count({ where }),
    ]);
    return { records, total };
  }

  private async findPairs(where: Prisma.ListingWhereInput): Promise<ListingPair[]> {
    return this.prisma.listing.findMany({
      where: { ...where, ...onChannel() },
      select: { connectionId: true, productId: true },
      distinct: ['connectionId', 'productId'],
    });
  }

  /** Updates one listing of the workspace; none updated means it is not found. */
  private async updateListing(
    client: Pick<Prisma.TransactionClient, 'listing'>,
    { workspaceId, listingId }: ListingRef,
    data: Prisma.ListingUpdateManyMutationInput,
  ): Promise<void> {
    const { count } = await client.listing.updateMany({
      where: { id: listingId, workspaceId },
      data,
    });
    if (count === 0) {
      throw new NotFoundException(LISTING_NOT_FOUND);
    }
  }
}
