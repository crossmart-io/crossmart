<?php

declare(strict_types=1);

namespace Crossmart\Pagination;

/**
 * One page of a list.
 *
 * @template T
 */
final class Page
{
    /**
     * @param list<T> $items The items on this page.
     * @param string|null $nextCursor Pass it as `cursor` to get the next page. Null on the last page.
     * @param int $total How many items match the filters across all pages.
     */
    public function __construct(
        public readonly array $items,
        public readonly ?string $nextCursor,
        public readonly int $total,
    ) {
    }

    /**
     * @template TItem
     *
     * @param list<TItem> $items
     *
     * @return self<TItem>
     */
    public static function of(array $items, ?string $nextCursor, int|float $total): self
    {
        return new self($items, $nextCursor, (int) $total);
    }

    public function hasMore(): bool
    {
        return $this->nextCursor !== null;
    }
}
