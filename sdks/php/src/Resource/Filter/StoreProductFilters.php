<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\ChannelProductSort;
use Crossmart\Enum\ChannelProductState;
use Crossmart\Enum\SortDirection;

/**
 * Filters and order of a store's products. Every filter is optional.
 */
final class StoreProductFilters
{
    /**
     * @param ChannelProductState|null $state Listed, pending, failed, removing, or `Excluded` for catalog products the store lacks.
     */
    public function __construct(
        public readonly ?ChannelProductState $state = null,
        public readonly ?string $search = null,
        public readonly ?ChannelProductSort $sort = null,
        public readonly ?SortDirection $direction = null,
    ) {
    }
}
