import { Injectable } from '@nestjs/common';
import { FalabellaAccountVerifier } from './account/falabella-account.verifier.js';
import { FalabellaInventorySync } from './inventory/falabella-inventory-sync.js';
import { FalabellaOrderSource } from './orders/falabella-order-source.js';
import { FalabellaListingPublisher } from './publish/falabella-listing-publisher.js';
import { FalabellaPriceUpdater } from './publish/falabella-price-updater.js';
import { FalabellaTaxonomyReader } from './taxonomy/falabella-taxonomy.reader.js';

/** What the connector sells through: products, their prices and the categories they go in. */
@Injectable()
export class FalabellaSellingServices {
  constructor(
    readonly publisher: FalabellaListingPublisher,
    readonly prices: FalabellaPriceUpdater,
    readonly taxonomy: FalabellaTaxonomyReader,
  ) {}
}

/** What keeps the account two-way: its orders, the stock sent back, and the account itself. */
@Injectable()
export class FalabellaSyncServices {
  constructor(
    readonly account: FalabellaAccountVerifier,
    readonly orders: FalabellaOrderSource,
    readonly stock: FalabellaInventorySync,
  ) {}
}
