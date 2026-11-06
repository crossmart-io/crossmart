<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\ProductSort;
use Crossmart\Enum\ProductStatus;
use Crossmart\Enum\ProductStoreFilter;
use Crossmart\Enum\SortDirection;

/**
 * Filters and order of a product list. Every filter is optional.
 */
final class ProductFilters
{
    /**
     * @param string|null $search Matches the title, handle or SKU.
     * @param CatalogGap|null $gap Products missing something channels need, such as images or a barcode.
     * @param list<string>|null $tags Products with any of these tags.
     * @param ProductStoreFilter|null $storeFilter With `storeId`: products in that store, or not in it.
     */
    public function __construct(
        public readonly ?string $search = null,
        public readonly ?ProductStatus $status = null,
        public readonly ?CatalogGap $gap = null,
        public readonly ?array $tags = null,
        public readonly ?string $vendor = null,
        public readonly ?ProductStoreFilter $storeFilter = null,
        public readonly ?string $storeId = null,
        public readonly ?ProductSort $sort = null,
        public readonly ?SortDirection $direction = null,
    ) {
    }
}
