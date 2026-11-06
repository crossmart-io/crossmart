<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\OrderStatus;
use Crossmart\Enum\SortDirection;

/**
 * Filters and order of the order list. Every filter is optional.
 */
final class OrderFilters
{
    /**
     * @param string|null $connectionId Orders of one store.
     */
    public function __construct(
        public readonly ?OrderStatus $status = null,
        public readonly ?string $connectionId = null,
        public readonly ?string $search = null,
        public readonly ?SortDirection $direction = null,
    ) {
    }
}
