<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum CatalogGap: string
{
    case Images = 'images';
    case Description = 'description';
    case Sku = 'sku';
    case Barcode = 'barcode';
    case OutOfStock = 'out_of_stock';
}
