<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Config\Defaults;
use Crossmart\Model\OrderDetailDto;
use Crossmart\Model\OrderSummaryDto;
use Crossmart\Pagination\Page;
use Crossmart\Pagination\Paginator;
use Crossmart\Resource\Filter\OrderFilters;
use Generator;

/**
 * Read the orders Crossmart ingested from the connected stores. Orders hold no buyer details.
 */
final class Orders extends AbstractResource
{
    /**
     * One page of orders, newest first.
     *
     * @return Page<OrderSummaryDto>
     */
    public function list(?OrderFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new OrderFilters();
        $page = $this->api->orders->ordersControllerListV1(
            workspaceId: $this->workspaceId(),
            status: $filters->status,
            connectionId: $filters->connectionId,
            search: $filters->search,
            direction: $filters->direction,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * Every matching order, fetched page by page as you iterate.
     *
     * @return Generator<int, OrderSummaryDto>
     */
    public function listAll(?OrderFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->list($filters, $cursor, $pageSize));
    }

    /**
     * One order with its lines and the stock each holds.
     */
    public function get(string $orderId): OrderDetailDto
    {
        return $this->api->orders->ordersControllerGetV1($this->workspaceId(), $orderId);
    }
}
