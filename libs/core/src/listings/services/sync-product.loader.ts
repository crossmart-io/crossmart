import { Injectable, NotFoundException } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import { ProductsService } from '../../catalog/services/products.service.js';

/** The catalog product a sync job is about, or null once it is deleted. */
@Injectable()
export class SyncProductLoader {
  constructor(private readonly products: ProductsService) {}

  async find(workspaceId: string, productId: string): Promise<ProductDetail | null> {
    try {
      return await this.products.get(workspaceId, productId);
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
