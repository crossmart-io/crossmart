<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Enum\CatalogGap;
use Crossmart\Enum\ProductStatus;
use Crossmart\Resource\Filter\ProductFilters;

final class PaginationTest extends TestCase
{
    private const NEXT_CURSOR = '44444444-4444-4444-8444-444444444444';

    public function testListReturnsOnePage(): void
    {
        $this->respond(body: ['items' => [self::fixture('ProductSummaryDto')], 'nextCursor' => self::NEXT_CURSOR, 'total' => 7]);

        $page = $this->client()->products->list(limit: 1);

        self::assertCount(1, $page->items);
        self::assertSame(self::NEXT_CURSOR, $page->nextCursor);
        self::assertSame(7, $page->total);
        self::assertTrue($page->hasMore());
        self::assertSame('limit=1', $this->lastQuery());
    }

    public function testListSendsTheFiltersAndTheCursor(): void
    {
        $this->respond(body: self::page([]));

        $this->client()->products->list(
            new ProductFilters(search: 'linen apron', status: ProductStatus::Active, gap: CatalogGap::Images, tags: ['summer', 'sale']),
            cursor: self::NEXT_CURSOR,
        );

        self::assertSame(
            'search=linen%20apron&status=ACTIVE&gap=images&tags=summer&tags=sale&cursor=' . self::NEXT_CURSOR,
            $this->lastQuery(),
        );
    }

    public function testListAllFollowsTheCursors(): void
    {
        $this->respond(body: self::page([self::fixture('ProductSummaryDto')], self::NEXT_CURSOR));
        $this->respond(body: self::page([self::fixture('ProductSummaryDto')]));

        $products = iterator_to_array($this->client()->products->listAll(), false);

        self::assertCount(2, $products);
        self::assertSame('cursor=' . self::NEXT_CURSOR . '&limit=100', $this->lastQuery());
    }

    public function testListAllIsLazy(): void
    {
        $this->respond(body: self::page([self::fixture('ProductSummaryDto')], self::NEXT_CURSOR));

        $products = $this->client()->products->listAll();
        self::assertSame(0, $this->requestCount());

        $products->current();
        self::assertSame(1, $this->requestCount());
    }
}
