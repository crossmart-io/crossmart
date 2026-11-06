<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Enum\SalesRange;
use Crossmart\Model\InventoryReportDto;
use Crossmart\Model\SalesReportDto;

/**
 * Sales over time and the value of the stock, in the workspace currency.
 */
final class Reports extends AbstractResource
{
    /**
     * Sales over time, by store, compared with the period before.
     *
     * Buckets follow `$timeZone` (an IANA name such as `America/New_York`). Cancelled orders and
     * orders in other currencies are left out.
     */
    public function sales(SalesRange $range = SalesRange::Last30Days, ?string $timeZone = null): SalesReportDto
    {
        return $this->api->analytics->salesReportControllerGetV1($this->workspaceId(), $range, $timeZone);
    }

    /**
     * Stock value, stock levels and each store's listings, as of now. Variants without a cost are
     * counted apart.
     */
    public function inventory(): InventoryReportDto
    {
        return $this->api->analytics->inventoryReportControllerGetV1($this->workspaceId());
    }
}
