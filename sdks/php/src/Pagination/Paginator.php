<?php

declare(strict_types=1);

namespace Crossmart\Pagination;

use Generator;

/**
 * Follows the cursors of a list and yields every item, fetching each page when it is needed.
 */
final class Paginator
{
    /**
     * @template T
     *
     * @param callable(string|null): Page<T> $fetchPage Fetches the page at a cursor (null for the first).
     *
     * @return Generator<int, T>
     */
    public static function items(callable $fetchPage): Generator
    {
        $cursor = null;
        do {
            $page = $fetchPage($cursor);
            yield from $page->items;
            $cursor = $page->nextCursor;
        } while ($cursor !== null);
    }
}
