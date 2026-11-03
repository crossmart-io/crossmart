import { Injectable } from '@nestjs/common';
import { ShopifyInventorySync } from './inventory/shopify-inventory-sync.js';
import { ShopifyListingPublisher } from './publish/shopify-listing-publisher.js';

/** What the connector writes to a store: listings and their stock. */
@Injectable()
export class ShopifyListingCapabilities {
  constructor(
    readonly publisher: ShopifyListingPublisher,
    readonly inventory: ShopifyInventorySync,
  ) {}
}
