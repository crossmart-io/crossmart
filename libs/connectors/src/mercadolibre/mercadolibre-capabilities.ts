import { Injectable } from '@nestjs/common';
import { MercadoLibreUserReader } from './account/mercadolibre-user.reader.js';
import { MercadoLibreInventorySync } from './inventory/mercadolibre-inventory-sync.js';
import { MercadoLibreNotificationParser } from './notifications/mercadolibre-notification.parser.js';
import { MercadoLibreOrderSource } from './orders/mercadolibre-order-source.js';
import { MercadoLibreListingPublisher } from './publish/mercadolibre-listing-publisher.js';
import { MercadoLibrePriceUpdater } from './publish/mercadolibre-price-updater.js';
import { MercadoLibreCategoryReader } from './taxonomy/mercadolibre-category.reader.js';
import { MercadoLibreCategoryAttributesReader } from './taxonomy/mercadolibre-category-attributes.reader.js';

/** What the connector sells through: items, their prices, and the categories they go in. */
@Injectable()
export class MercadoLibreSellingServices {
  constructor(
    readonly publisher: MercadoLibreListingPublisher,
    readonly prices: MercadoLibrePriceUpdater,
    readonly categories: MercadoLibreCategoryReader,
    readonly attributes: MercadoLibreCategoryAttributesReader,
  ) {}
}

/**
 * What keeps the account two-way: its orders (polled, and read when a notification names
 * one), the stock Crossmart sends back to its items, and the seller, read on connect.
 */
@Injectable()
export class MercadoLibreSyncServices {
  constructor(
    readonly user: MercadoLibreUserReader,
    readonly orders: MercadoLibreOrderSource,
    readonly stock: MercadoLibreInventorySync,
    readonly notifications: MercadoLibreNotificationParser,
  ) {}
}
