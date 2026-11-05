"""Orders from every connected store."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterator
from typing import TypedDict, Unpack
from uuid import UUID

from .._core import AsyncResource, SyncResource
from .._generated.api.orders import orders_controller_get_v_1, orders_controller_list_v_1
from .._generated.models import OrderDetailDto, OrderStatus, OrderSummaryDto, SortDirection
from .._response import translate_transport_errors, unwrap
from .._utils import Id, as_str, optional_uuid, or_unset
from ..pagination import Page, aiterate_pages, iterate_pages


class OrderFilters(TypedDict, total=False):
    """Filters and order of the order list. Every key is optional."""

    status: OrderStatus
    connection_id: UUID
    """Orders of one store."""
    search: str
    direction: SortDirection


class Orders(SyncResource):
    """Read the orders Crossmart ingested from the connected stores. Orders hold no buyer details.

    Example::

        from crossmart.models import OrderStatus

        for order in client.orders.iter(status=OrderStatus.OPEN):
            print(order.name, order.store_name, order.total, order.currency_code)
    """

    def list(
        self, *, cursor: Id | None = None, limit: int | None = None, **filters: Unpack[OrderFilters]
    ) -> Page[OrderSummaryDto]:
        """One page of orders, newest first."""
        with translate_transport_errors():
            response = orders_controller_list_v_1.sync_detailed(
                self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[OrderFilters]
    ) -> Iterator[OrderSummaryDto]:
        """Every matching order, fetched page by page."""
        return iterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    def get(self, order_id: Id) -> OrderDetailDto:
        """One order with its lines and the stock each holds."""
        with translate_transport_errors():
            response = orders_controller_get_v_1.sync_detailed(
                self._workspace(), as_str(order_id), client=self._http
            )
        return unwrap(response)


class AsyncOrders(AsyncResource):
    """The asynchronous counterpart of :class:`Orders`."""

    async def list(
        self, *, cursor: Id | None = None, limit: int | None = None, **filters: Unpack[OrderFilters]
    ) -> Page[OrderSummaryDto]:
        """One page of orders, newest first."""
        with translate_transport_errors():
            response = await orders_controller_list_v_1.asyncio_detailed(
                await self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[OrderFilters]
    ) -> AsyncIterator[OrderSummaryDto]:
        """Every matching order. Use with ``async for``."""
        return aiterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    async def get(self, order_id: Id) -> OrderDetailDto:
        """One order with its lines and the stock each holds."""
        with translate_transport_errors():
            response = await orders_controller_get_v_1.asyncio_detailed(
                await self._workspace(), as_str(order_id), client=self._http
            )
        return unwrap(response)
