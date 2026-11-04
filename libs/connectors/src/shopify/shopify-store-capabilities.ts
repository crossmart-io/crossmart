import { Injectable } from '@nestjs/common';
import { ShopifyCatalogReader } from './catalog/shopify-catalog.reader.js';
import { ShopifyInventorySync } from './inventory/shopify-inventory-sync.js';
import { ShopifyOrderSource } from './orders/shopify-order-source.js';
import { ShopifyListingPublisher } from './publish/shopify-listing-publisher.js';

/** What the connector reads from and writes to a store: its catalog, listings, stock and orders. */
@Injectable()
export class ShopifyStoreCapabilities {
  constructor(
    readonly catalog: ShopifyCatalogReader,
    readonly publisher: ShopifyListingPublisher,
    readonly inventory: ShopifyInventorySync,
    readonly orders: ShopifyOrderSource,
  ) {}
}
