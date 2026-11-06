<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum CatalogImportFormat: string
{
    case ShopifyCsv = 'shopify_csv';
    case InventoryCsv = 'inventory_csv';
    case ShopifyApi = 'shopify_api';
}
