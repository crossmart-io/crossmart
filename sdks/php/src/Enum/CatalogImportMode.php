<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `create` adds new products (Shopify CSV), `update` replaces products matched by handle (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV)
 */
enum CatalogImportMode: string
{
    case Create = 'create';
    case Update = 'update';
    case Inventory = 'inventory';
    case CreateOrLink = 'create_or_link';
}
