import { Injectable } from '@nestjs/common';
import { EtsyShopReader } from './account/etsy-shop.reader.js';
import { EtsyInventorySync } from './inventory/etsy-inventory-sync.js';
import { EtsyOrderSource } from './orders/etsy-order-source.js';
import { EtsyListingPublisher } from './publish/etsy-listing-publisher.js';
import { EtsyPriceUpdater } from './publish/etsy-price-updater.js';
import { EtsyTaxonomyReader } from './taxonomy/etsy-taxonomy.reader.js';

/** What the connector sells through: listings, their prices and the categories they go in. */
@Injectable()
export class EtsySellingServices {
  constructor(
    readonly publisher: EtsyListingPublisher,
    readonly prices: EtsyPriceUpdater,
    readonly taxonomy: EtsyTaxonomyReader,
  ) {}
}

/**
 * What keeps the shop two-way: its orders, read to move Crossmart's stock, and the stock
 * Crossmart sends back to its listings; and the shop itself, read on connect and refresh.
 */
@Injectable()
export class EtsySyncServices {
  constructor(
    readonly shop: EtsyShopReader,
    readonly orders: EtsyOrderSource,
    readonly stock: EtsyInventorySync,
  ) {}
}
