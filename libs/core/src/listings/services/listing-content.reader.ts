import { Injectable } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ListingContent } from '../entities/listing-override.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import type { OverrideTarget } from './listing-override.writer.js';
import { SyncProductLoader } from './sync-product.loader.js';

/** A product and what its listing on one connection shows. */
export interface ProductListingContent {
  product: ProductDetail;
  content: ListingContent;
}

/**
 * What a product shows on one connection: each content field's override, or the product's own
 * value where the listing has none. The same values a publish sends.
 */
@Injectable()
export class ListingContentReader {
  constructor(
    private readonly products: SyncProductLoader,
    private readonly listings: ListingSyncRepository,
  ) {}

  /** Null once the product is gone. */
  async read(target: OverrideTarget): Promise<ProductListingContent | null> {
    const product = await this.products.find(target.workspaceId, target.productId);
    if (!product) return null;
    const listing = await this.listings.findPrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    const override = listing?.override ?? null;
    return {
      product,
      content: {
        title: override?.title ?? product.title,
        descriptionHtml: override?.descriptionHtml ?? product.descriptionHtml,
      },
    };
  }
}
