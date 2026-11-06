<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Config\Defaults;
use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\StockAdjustmentMode;
use Crossmart\Model\AdjustStockDto;
use Crossmart\Model\InventoryItemDto;
use Crossmart\Model\InventoryMovementDto;
use Crossmart\Pagination\Page;
use Crossmart\Pagination\Paginator;
use Crossmart\Resource\Filter\InventoryFilters;
use Crossmart\Resource\Filter\MovementFilters;
use Generator;

/**
 * Read stock levels, adjust them, and read each variant's stock history.
 *
 * Every change is written to the ledger with its reason and author (the API key or agent).
 *
 * ```php
 * foreach ($client->inventory->listAll(new InventoryFilters(stockLevel: StockLevel::LowStock)) as $item) {
 *     $client->inventory->adjust($item->inventoryItemId, 10, InventoryMovementReason::Received);
 * }
 * ```
 */
final class Inventory extends AbstractResource
{
    /**
     * One page of the stock of every variant, by product title.
     *
     * @return Page<InventoryItemDto>
     */
    public function list(?InventoryFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new InventoryFilters();
        $page = $this->api->inventory->inventoryItemsControllerListV1(
            workspaceId: $this->workspaceId(),
            search: $filters->search,
            stockLevel: $filters->stockLevel,
            sort: $filters->sort,
            direction: $filters->direction,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * The stock of every matching variant, fetched page by page as you iterate.
     *
     * @return Generator<int, InventoryItemDto>
     */
    public function listAll(?InventoryFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->list($filters, $cursor, $pageSize));
    }

    /**
     * Adjusts the stock on hand of a variant.
     *
     * With `StockAdjustmentMode::Delta` (the default) `$quantity` units are added, or removed when
     * negative. With `StockAdjustmentMode::Set` it is the counted stock on hand.
     */
    public function adjust(
        string $inventoryItemId,
        int $quantity,
        InventoryMovementReason $reason,
        StockAdjustmentMode $mode = StockAdjustmentMode::Delta,
        ?string $note = null,
    ): InventoryItemDto {
        $body = new AdjustStockDto(mode: $mode, quantity: $quantity, reason: $reason, note: $note);

        return $this->api->inventory->inventoryItemsControllerAdjustV1($this->workspaceId(), $inventoryItemId, $body);
    }

    /**
     * One page of a variant's stock history, newest first.
     *
     * @return Page<InventoryMovementDto>
     */
    public function listMovements(string $inventoryItemId, ?MovementFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new MovementFilters();
        $page = $this->api->inventory->inventoryItemsControllerHistoryV1(
            workspaceId: $this->workspaceId(),
            inventoryItemId: $inventoryItemId,
            reason: $filters->reason,
            direction: $filters->direction,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * A variant's whole stock history, fetched page by page as you iterate.
     *
     * @return Generator<int, InventoryMovementDto>
     */
    public function listAllMovements(string $inventoryItemId, ?MovementFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->listMovements($inventoryItemId, $filters, $cursor, $pageSize));
    }
}
