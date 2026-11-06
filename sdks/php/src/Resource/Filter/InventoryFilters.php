<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\InventorySort;
use Crossmart\Enum\SortDirection;
use Crossmart\Enum\StockLevel;

/**
 * Filters and order of the stock list. Every filter is optional.
 */
final class InventoryFilters
{
    public function __construct(
        public readonly ?string $search = null,
        public readonly ?StockLevel $stockLevel = null,
        public readonly ?InventorySort $sort = null,
        public readonly ?SortDirection $direction = null,
    ) {
    }
}
