<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

/**
 * The event types Crossmart sends today. New types may be added without a major version, so
 * {@see WebhookEvent::$type} stays a string; compare it with these values.
 */
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
