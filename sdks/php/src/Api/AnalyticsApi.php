<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\SalesRange;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\InventoryReportDto;
use Crossmart\Model\ListingHealthReportDto;
use Crossmart\Model\SalesReportDto;

/**
 * The operations tagged "Analytics".
 */
final class AnalyticsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Sales over time, by store, compared with the period before
     *
     * Order totals in the workspace currency, bucketed in the given time zone. Cancelled orders and orders in other currencies are left out.
     *
     * @param string|null $timeZone IANA time zone that days, weeks and months follow. Defaults to the workspace's time zone, else UTC.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function salesReportControllerGetV1(
        string $workspaceId,
        SalesRange|string|null $range = null,
        ?string $timeZone = null,
    ): SalesReportDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/analytics/sales',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['range' => $range, 'timeZone' => $timeZone],
        ));

        return SalesReportDto::fromArray($response->object());
    }

    /**
     * Stock value, stock levels and each store’s listings, as of now
     *
     * Values are in the workspace currency; variants without a cost are counted apart.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function inventoryReportControllerGetV1(
        string $workspaceId,
    ): InventoryReportDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/analytics/inventory',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return InventoryReportDto::fromArray($response->object());
    }

    /**
     * Each store’s products by display state, and the latest failed listings, as of now
     *
     * Counts follow the same rule as each store’s product list. Each failed listing carries `displayState`, `displayReason` and `displayRequirement`, so a client can link to the fix.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function listingHealthReportControllerGetV1(
        string $workspaceId,
    ): ListingHealthReportDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/analytics/listings',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return ListingHealthReportDto::fromArray($response->object());
    }
}
