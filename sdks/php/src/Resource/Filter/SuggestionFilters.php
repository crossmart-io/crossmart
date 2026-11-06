<?php

declare(strict_types=1);

namespace Crossmart\Resource\Filter;

use Crossmart\Enum\SuggestionKind;
use Crossmart\Enum\SuggestionStatus;

/**
 * Filters of the suggestion list. Every filter is optional.
 */
final class SuggestionFilters
{
    /**
     * @param SuggestionStatus|null $status `SuggestionStatus::Pending` for the inbox.
     * @param string|null $connectionId Suggestions for one store.
     */
    public function __construct(
        public readonly ?SuggestionStatus $status = null,
        public readonly ?string $productId = null,
        public readonly ?string $connectionId = null,
        public readonly ?SuggestionKind $kind = null,
    ) {
    }
}
