import { Injectable } from '@nestjs/common';
import { ListingStatus, PrismaService } from '@crossmart/database';
import type { SaleStockItem } from '../entities/product-sale.js';

/** What marking a product sold reads: its variants' stock and the stores listing it. */
@Injectable()
export class ProductSaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStock(workspaceId: string, productId: string): Promise<SaleStockItem[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { workspaceId, variant: { productId } },
      select: { id: true, tracked: true, available: true },
    });
    return items.map(({ id, tracked, available }) => ({ inventoryItemId: id, tracked, available }));
  }

  /** The stores with a listing of the product that is not delisted yet. */
  async findListedConnectionIds(workspaceId: string, productId: string): Promise<Set<string>> {
    const listings = await this.prisma.listing.findMany({
      where: { workspaceId, productId, status: { not: ListingStatus.DELISTED } },
      select: { connectionId: true },
      distinct: ['connectionId'],
    });
    return new Set(listings.map((listing) => listing.connectionId));
  }
}
