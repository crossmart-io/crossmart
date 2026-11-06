<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\OrderStatus;
use Crossmart\Enum\SortDirection;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\OrderDetailDto;
use Crossmart\Model\OrderPageDto;

/**
 * The operations tagged "Orders".
 */
final class OrdersApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Orders from every connected store, newest first
     *
     * Orders hold no buyer details. Each line shows the stock it holds.
     *
     * @param string|null $connectionId Orders of one store
     * @param string|null $search Matches the order number
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ordersControllerListV1(
        string $workspaceId,
        OrderStatus|string|null $status = null,
        ?string $connectionId = null,
        ?string $search = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): OrderPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/orders',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['status' => $status, 'connectionId' => $connectionId, 'search' => $search, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return OrderPageDto::fromArray($response->object());
    }

    /**
     * One order with its lines and the stock each holds
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function ordersControllerGetV1(
        string $workspaceId,
        string $orderId,
    ): OrderDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/orders/{orderId}',
            pathParameters: ['workspaceId' => $workspaceId, 'orderId' => $orderId],
        ));

        return OrderDetailDto::fromArray($response->object());
    }
}
