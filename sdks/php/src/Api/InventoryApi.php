<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\InventorySort;
use Crossmart\Enum\SortDirection;
use Crossmart\Enum\StockLevel;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AdjustStockDto;
use Crossmart\Model\InventoryItemDto;
use Crossmart\Model\InventoryMovementPageDto;
use Crossmart\Model\InventoryPageDto;

/**
 * The operations tagged "Inventory".
 */
final class InventoryApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Stock of every variant, by product title
     *
     * @param string|null $search Matches the SKU or the product title
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function inventoryItemsControllerListV1(
        string $workspaceId,
        ?string $search = null,
        StockLevel|string|null $stockLevel = null,
        InventorySort|string|null $sort = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): InventoryPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/inventory-items',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['search' => $search, 'stockLevel' => $stockLevel, 'sort' => $sort, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return InventoryPageDto::fromArray($response->object());
    }

    /**
     * Adjust the stock on hand of a variant
     *
     * Adds or removes units, or sets the counted stock, and records the change in the ledger with its reason and author. Reserved units are not changed.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function inventoryItemsControllerAdjustV1(
        string $workspaceId,
        string $inventoryItemId,
        AdjustStockDto $body,
    ): InventoryItemDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/inventory-items/{inventoryItemId}/adjustments',
            pathParameters: ['workspaceId' => $workspaceId, 'inventoryItemId' => $inventoryItemId],
            body: $body->toArray(),
        ));

        return InventoryItemDto::fromArray($response->object());
    }

    /**
     * Stock history of a variant, newest first
     *
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function inventoryItemsControllerHistoryV1(
        string $workspaceId,
        string $inventoryItemId,
        InventoryMovementReason|string|null $reason = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): InventoryMovementPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/inventory-items/{inventoryItemId}/movements',
            pathParameters: ['workspaceId' => $workspaceId, 'inventoryItemId' => $inventoryItemId],
            query: ['reason' => $reason, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return InventoryMovementPageDto::fromArray($response->object());
    }
}
