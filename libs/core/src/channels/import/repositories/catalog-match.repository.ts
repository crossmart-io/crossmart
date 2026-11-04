import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { CatalogProductRef } from '../entities/channel-import.js';

const MATCH_SELECT = {
  id: true,
  handle: true,
  variants: {
    select: { id: true, sku: true, optionValues: true },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.ProductSelect;

type MatchRecord = Prisma.ProductGetPayload<{ select: typeof MATCH_SELECT }>;

/** A catalog product with what channel products and variants are matched on. */
export interface CatalogMatchCandidate extends CatalogProductRef {
  handle: string;
}

/**
 * Reads the catalog products a page of channel products may match: one query per way of
 * matching, whatever the page size. Every query is scoped to the workspace.
 */
@Injectable()
export class CatalogMatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIds(workspaceId: string, productIds: string[]): Promise<CatalogMatchCandidate[]> {
    return this.findMany({ workspaceId, id: { in: productIds } });
  }

  findByHandles(workspaceId: string, handles: string[]): Promise<CatalogMatchCandidate[]> {
    return this.findMany({ workspaceId, handle: { in: handles } });
  }

  /** Products holding any of these SKUs. */
  findBySkus(workspaceId: string, skus: string[]): Promise<CatalogMatchCandidate[]> {
    return this.findMany({ workspaceId, variants: { some: { workspaceId, sku: { in: skus } } } });
  }

  private async findMany(where: Prisma.ProductWhereInput): Promise<CatalogMatchCandidate[]> {
    const records: MatchRecord[] = await this.prisma.product.findMany({
      where,
      select: MATCH_SELECT,
    });
    return records;
  }
}
