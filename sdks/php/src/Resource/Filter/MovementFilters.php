<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\SortDirection;

/**
 * Filters and order of a variant's stock history. Every filter is optional.
 */
final class MovementFilters
{
    public function __construct(
        public readonly ?InventoryMovementReason $reason = null,
        public readonly ?SortDirection $direction = null,
    ) {
    }
}
