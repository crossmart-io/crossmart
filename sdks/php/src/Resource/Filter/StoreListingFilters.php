<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\ListingStatus;

/**
 * Filters of a store's listings. Every filter is optional.
 */
final class StoreListingFilters
{
    public function __construct(
        public readonly ?ListingStatus $status = null,
    ) {
    }
}
