"""Sales and inventory reports."""

from __future__ import annotations

from .._core import AsyncResource, SyncResource
from .._generated.api.analytics import (
    inventory_report_controller_get_v_1,
    listing_health_report_controller_get_v_1,
    sales_report_controller_get_v_1,
)
from .._generated.models import (
    InventoryReportDto,
    ListingHealthReportDto,
    SalesRange,
    SalesReportDto,
)
from .._response import translate_transport_errors, unwrap
from .._utils import or_unset


class Reports(SyncResource):
    """Sales over time and the value of the stock, in the workspace currency.

    Example::

        from crossmart.models import SalesRange

        report = client.reports.sales(range_=SalesRange.LAST_7_DAYS, time_zone="Europe/London")
    """

    def sales(
        self, *, range_: SalesRange = SalesRange.LAST_30_DAYS, time_zone: str | None = None
    ) -> SalesReportDto:
        """Sales over time, by store, compared with the period before.

        Buckets follow ``time_zone`` (an IANA name such as ``"America/New_York"``). Cancelled
        orders and orders in other currencies are left out.
        """
        with translate_transport_errors():
            response = sales_report_controller_get_v_1.sync_detailed(
                self._workspace(), client=self._http, range_=range_, time_zone=or_unset(time_zone)
            )
        return unwrap(response)

    def inventory(self) -> InventoryReportDto:
        """Stock value, stock levels, the variants lowest on stock and each store's listings.

        Variants without a cost are counted apart.
        """
        with translate_transport_errors():
            response = inventory_report_controller_get_v_1.sync_detailed(
                self._workspace(), client=self._http
            )
        return unwrap(response)

    def listing_health(self) -> ListingHealthReportDto:
        """Each store's products by display state, and the latest failed listings, as of now.

        Each failure carries its display state and requirement, so you can tell what to fix.
        """
        with translate_transport_errors():
            response = listing_health_report_controller_get_v_1.sync_detailed(
                self._workspace(), client=self._http
            )
        return unwrap(response)


class AsyncReports(AsyncResource):
    """The asynchronous counterpart of :class:`Reports`."""

    async def sales(
        self, *, range_: SalesRange = SalesRange.LAST_30_DAYS, time_zone: str | None = None
    ) -> SalesReportDto:
        """Sales over time, by store. See :meth:`Reports.sales`."""
        with translate_transport_errors():
            response = await sales_report_controller_get_v_1.asyncio_detailed(
                await self._workspace(),
                client=self._http,
                range_=range_,
                time_zone=or_unset(time_zone),
            )
        return unwrap(response)

    async def inventory(self) -> InventoryReportDto:
        """Stock value, stock levels and each store's listings, as of now."""
        with translate_transport_errors():
            response = await inventory_report_controller_get_v_1.asyncio_detailed(
                await self._workspace(), client=self._http
            )
        return unwrap(response)

    async def listing_health(self) -> ListingHealthReportDto:
        """Each store's products by display state. See :meth:`Reports.listing_health`."""
        with translate_transport_errors():
            response = await listing_health_report_controller_get_v_1.asyncio_detailed(
                await self._workspace(), client=self._http
            )
        return unwrap(response)
