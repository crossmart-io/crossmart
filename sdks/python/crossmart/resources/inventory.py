"""Stock levels and the inventory ledger."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterator
from typing import TypedDict, Unpack

from .._core import AsyncResource, SyncResource
from .._generated.api.inventory import (
    inventory_items_controller_adjust_v_1,
    inventory_items_controller_history_v_1,
    inventory_items_controller_list_v_1,
)
from .._generated.models import (
    AdjustStockDto,
    InventoryItemDto,
    InventoryMovementDto,
    InventoryMovementReason,
    InventorySort,
    SortDirection,
    StockAdjustmentMode,
    StockLevel,
)
from .._response import translate_transport_errors, unwrap
from .._utils import Id, as_str, optional_uuid, or_unset
from ..pagination import Page, aiterate_pages, iterate_pages


class InventoryFilters(TypedDict, total=False):
    """Filters and order of the stock list. Every key is optional."""

    search: str
    stock_level: StockLevel
    sort: InventorySort
    direction: SortDirection


class MovementFilters(TypedDict, total=False):
    """Filters and order of a variant's stock history. Every key is optional."""

    reason: InventoryMovementReason
    direction: SortDirection


def _adjustment(
    quantity: int, reason: InventoryMovementReason, mode: StockAdjustmentMode, note: str | None
) -> AdjustStockDto:
    return AdjustStockDto(mode=mode, quantity=quantity, reason=reason, note=or_unset(note))


class Inventory(SyncResource):
    """Read stock levels, adjust them, and read each variant's stock history.

    Every change is written to the ledger with its reason and author (the API key or agent).

    Example::

        from crossmart.models import InventoryMovementReason, StockLevel

        for item in client.inventory.iter(stock_level=StockLevel.LOW_STOCK):
            client.inventory.adjust(item.inventory_item_id, 10, InventoryMovementReason.RECEIVED)
    """

    def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[InventoryFilters],
    ) -> Page[InventoryItemDto]:
        """One page of the stock of every variant, by product title."""
        with translate_transport_errors():
            response = inventory_items_controller_list_v_1.sync_detailed(
                self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[InventoryFilters]
    ) -> Iterator[InventoryItemDto]:
        """The stock of every matching variant, fetched page by page."""
        return iterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    def adjust(
        self,
        inventory_item_id: Id,
        quantity: int,
        reason: InventoryMovementReason,
        *,
        mode: StockAdjustmentMode = StockAdjustmentMode.DELTA,
        note: str | None = None,
    ) -> InventoryItemDto:
        """Adjusts the stock on hand of a variant.

        With ``mode=StockAdjustmentMode.DELTA`` (the default) ``quantity`` units are added, or
        removed when negative. With ``StockAdjustmentMode.SET`` it is the counted stock on hand.
        ``reason`` is one of ``RECEIVED``, ``CORRECTION``, ``RETURNED``, ``DAMAGED``, ``LOST`` or
        ``SOLD``.

        Example::

            client.inventory.adjust(item_id, -2, InventoryMovementReason.DAMAGED, note="Dropped")
        """
        body = _adjustment(quantity, reason, mode, note)
        with translate_transport_errors():
            response = inventory_items_controller_adjust_v_1.sync_detailed(
                self._workspace(), as_str(inventory_item_id), client=self._http, body=body
            )
        return unwrap(response)

    def movements(
        self,
        inventory_item_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[MovementFilters],
    ) -> Page[InventoryMovementDto]:
        """One page of a variant's stock history, newest first."""
        with translate_transport_errors():
            response = inventory_items_controller_history_v_1.sync_detailed(
                self._workspace(),
                as_str(inventory_item_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_movements(
        self, inventory_item_id: Id, *, limit: int | None = None, **filters: Unpack[MovementFilters]
    ) -> Iterator[InventoryMovementDto]:
        """A variant's whole stock history, fetched page by page."""
        return iterate_pages(
            lambda cursor: self.movements(inventory_item_id, cursor=cursor, limit=limit, **filters)
        )


class AsyncInventory(AsyncResource):
    """The asynchronous counterpart of :class:`Inventory`."""

    async def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[InventoryFilters],
    ) -> Page[InventoryItemDto]:
        """One page of the stock of every variant. See :meth:`Inventory.list`."""
        with translate_transport_errors():
            response = await inventory_items_controller_list_v_1.asyncio_detailed(
                await self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[InventoryFilters]
    ) -> AsyncIterator[InventoryItemDto]:
        """The stock of every matching variant. Use with ``async for``."""
        return aiterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    async def adjust(
        self,
        inventory_item_id: Id,
        quantity: int,
        reason: InventoryMovementReason,
        *,
        mode: StockAdjustmentMode = StockAdjustmentMode.DELTA,
        note: str | None = None,
    ) -> InventoryItemDto:
        """Adjusts the stock on hand of a variant. See :meth:`Inventory.adjust`."""
        body = _adjustment(quantity, reason, mode, note)
        with translate_transport_errors():
            response = await inventory_items_controller_adjust_v_1.asyncio_detailed(
                await self._workspace(), as_str(inventory_item_id), client=self._http, body=body
            )
        return unwrap(response)

    async def movements(
        self,
        inventory_item_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[MovementFilters],
    ) -> Page[InventoryMovementDto]:
        """One page of a variant's stock history, newest first."""
        with translate_transport_errors():
            response = await inventory_items_controller_history_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(inventory_item_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_movements(
        self, inventory_item_id: Id, *, limit: int | None = None, **filters: Unpack[MovementFilters]
    ) -> AsyncIterator[InventoryMovementDto]:
        """A variant's whole stock history. Use with ``async for``."""
        return aiterate_pages(
            lambda cursor: self.movements(inventory_item_id, cursor=cursor, limit=limit, **filters)
        )
