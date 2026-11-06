<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum WebhookEventType: string
{
    case OrderCreated = 'order.created';
    case OrderUpdated = 'order.updated';
    case InventoryStockChanged = 'inventory.stock_changed';
    case ListingPublished = 'listing.published';
    case ListingFailed = 'listing.failed';
    case ListingRemoved = 'listing.removed';
    case ProductCreated = 'product.created';
    case ProductUpdated = 'product.updated';
    case ProductDeleted = 'product.deleted';
    case WebhookTest = 'webhook.test';
}
