"""Connected stores (channel connections), their pricing rules and what they list."""

from __future__ import annotations

import builtins
from collections.abc import AsyncIterator, Iterator, Mapping
from typing import Any, TypedDict, Unpack

from .._core import AsyncResource, SyncResource
from .._generated.api.channels import (
    channel_connections_controller_get_v_1,
    channel_connections_controller_list_v_1,
)
from .._generated.api.listings import (
    channel_products_controller_list_products_v_1,
    channel_rules_controller_preview_pricing_v_1,
    channel_rules_controller_update_pricing_v_1,
    channel_sync_controller_list_listings_v_1,
    channel_sync_controller_request_sync_v_1,
    channel_sync_controller_sync_progress_v_1,
)
from .._generated.models import (
    ChannelConnectionDto,
    ChannelListingDto,
    ChannelProductDto,
    ChannelProductSort,
    ChannelProductState,
    ListingStatus,
    PricingPreviewDto,
    PricingPreviewRequestDto,
    PricingRuleDto,
    SortDirection,
    SyncProgressDto,
    SyncRequestResultDto,
    UpdatePricingDto,
)
from .._response import translate_transport_errors, unwrap, unwrap_as
from .._utils import Id, as_model, as_str, optional_uuid, or_unset
from ..pagination import Page, aiterate_pages, iterate_pages

PricingRule = PricingRuleDto | Mapping[str, Any]
"""A pricing rule as a model, or a mapping in the API's JSON shape."""


class StoreProductFilters(TypedDict, total=False):
    """Filters and order of a store's products. Every key is optional."""

    state: ChannelProductState
    """Listed, pending, failed, removing, or ``EXCLUDED`` for catalog products the store lacks."""
    search: str
    sort: ChannelProductSort
    direction: SortDirection


class StoreListingFilters(TypedDict, total=False):
    """Filters of a store's listings. Every key is optional."""

    status: ListingStatus


def _pricing_body(rule: PricingRule | None) -> UpdatePricingDto:
    return UpdatePricingDto(rule=None if rule is None else as_model(PricingRuleDto, rule))


def _preview_body(rule: PricingRule | None, product_id: Id | None) -> PricingPreviewRequestDto:
    return PricingPreviewRequestDto(
        rule=None if rule is None else as_model(PricingRuleDto, rule),
        product_id=optional_uuid(product_id),
    )


class Stores(SyncResource):
    """The workspace's connected stores: Shopify shops, eBay accounts, Merchant Center accounts.

    Stores are connected in the Crossmart web app, because the merchant approves the app on the
    channel. Here you read them, set their pricing rule, and follow what they list.

    Example::

        for store in client.stores.list():
            print(store.id, store.channel, store.display_name, store.status)
    """

    def list(self) -> builtins.list[ChannelConnectionDto]:
        """The connected stores, in connection order."""
        with translate_transport_errors():
            response = channel_connections_controller_list_v_1.sync_detailed(
                self._workspace(), client=self._http
            )
        return unwrap(response)

    def get(self, store_id: Id) -> ChannelConnectionDto:
        with translate_transport_errors():
            response = channel_connections_controller_get_v_1.sync_detailed(
                self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap(response)

    def set_pricing(self, store_id: Id, rule: PricingRule | None) -> ChannelConnectionDto:
        """Sets how the store prices variants. The store's listings get the new prices at once.

        ``None`` removes the rule, so catalog prices are sent as they are.

        Example::

            from crossmart.models import CompareAtMode, PriceRounding, PricingRuleDto

            client.stores.set_pricing(store_id, PricingRuleDto(
                adjustment_percent="10", fixed_amount="0", rounding=PriceRounding.NONE,
                floor=None, compare_at=CompareAtMode.KEEP,
            ))
        """
        with translate_transport_errors():
            response = channel_rules_controller_update_pricing_v_1.sync_detailed(
                self._workspace(), as_str(store_id), client=self._http, body=_pricing_body(rule)
            )
        return unwrap(response)

    def preview_pricing(
        self, store_id: Id, rule: PricingRule | None, *, product_id: Id | None = None
    ) -> PricingPreviewDto:
        """Prices a real product with a rule, saved or not.

        Without ``product_id``, the first product the store lists is priced.
        """
        with translate_transport_errors():
            response = channel_rules_controller_preview_pricing_v_1.sync_detailed(
                self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_preview_body(rule, product_id),
            )
        return unwrap(response)

    def sync(self, store_id: Id) -> SyncRequestResultDto:
        """Publishes the store's selected products and delists the rest, in the background.

        Every selected product is queued to be published or updated, and every listing no longer
        selected to be delisted. Raises :class:`~crossmart.errors.PlanLimitError` when the plan has
        no room for the listings it would add.
        """
        with translate_transport_errors():
            response = channel_sync_controller_request_sync_v_1.sync_detailed(
                self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap_as(response, SyncRequestResultDto)

    def sync_progress(self, store_id: Id) -> SyncProgressDto:
        """How far the store's sync has come.

        ``pending`` counts the listings a sync or retry queued whose job has not finished,
        ``failed`` the listings in error, and ``done`` is true once nothing is pending.
        """
        with translate_transport_errors():
            response = channel_sync_controller_sync_progress_v_1.sync_detailed(
                self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap(response)

    def list_products(
        self,
        store_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[StoreProductFilters],
    ) -> Page[ChannelProductDto]:
        """One page of the store's products with their state on the channel."""
        with translate_transport_errors():
            response = channel_products_controller_list_products_v_1.sync_detailed(
                self._workspace(),
                as_str(store_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_products(
        self, store_id: Id, *, limit: int | None = None, **filters: Unpack[StoreProductFilters]
    ) -> Iterator[ChannelProductDto]:
        """All of the store's matching products, fetched page by page."""
        return iterate_pages(
            lambda cursor: self.list_products(store_id, cursor=cursor, limit=limit, **filters)
        )

    def list_listings(
        self,
        store_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[StoreListingFilters],
    ) -> Page[ChannelListingDto]:
        """One page of the store's listings, most recently changed first."""
        with translate_transport_errors():
            response = channel_sync_controller_list_listings_v_1.sync_detailed(
                self._workspace(),
                as_str(store_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_listings(
        self, store_id: Id, *, limit: int | None = None, **filters: Unpack[StoreListingFilters]
    ) -> Iterator[ChannelListingDto]:
        """All of the store's matching listings, fetched page by page."""
        return iterate_pages(
            lambda cursor: self.list_listings(store_id, cursor=cursor, limit=limit, **filters)
        )


class AsyncStores(AsyncResource):
    """The asynchronous counterpart of :class:`Stores`."""

    async def list(self) -> builtins.list[ChannelConnectionDto]:
        """The connected stores, in connection order."""
        with translate_transport_errors():
            response = await channel_connections_controller_list_v_1.asyncio_detailed(
                await self._workspace(), client=self._http
            )
        return unwrap(response)

    async def get(self, store_id: Id) -> ChannelConnectionDto:
        with translate_transport_errors():
            response = await channel_connections_controller_get_v_1.asyncio_detailed(
                await self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap(response)

    async def set_pricing(self, store_id: Id, rule: PricingRule | None) -> ChannelConnectionDto:
        """Sets how the store prices variants. See :meth:`Stores.set_pricing`."""
        with translate_transport_errors():
            response = await channel_rules_controller_update_pricing_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_pricing_body(rule),
            )
        return unwrap(response)

    async def preview_pricing(
        self, store_id: Id, rule: PricingRule | None, *, product_id: Id | None = None
    ) -> PricingPreviewDto:
        """Prices a real product with a rule, saved or not."""
        with translate_transport_errors():
            response = await channel_rules_controller_preview_pricing_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_preview_body(rule, product_id),
            )
        return unwrap(response)

    async def sync(self, store_id: Id) -> SyncRequestResultDto:
        """Queues the store's publishes and delistings. See :meth:`Stores.sync`."""
        with translate_transport_errors():
            response = await channel_sync_controller_request_sync_v_1.asyncio_detailed(
                await self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap_as(response, SyncRequestResultDto)

    async def sync_progress(self, store_id: Id) -> SyncProgressDto:
        """How far the store's sync has come. See :meth:`Stores.sync_progress`."""
        with translate_transport_errors():
            response = await channel_sync_controller_sync_progress_v_1.asyncio_detailed(
                await self._workspace(), as_str(store_id), client=self._http
            )
        return unwrap(response)

    async def list_products(
        self,
        store_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[StoreProductFilters],
    ) -> Page[ChannelProductDto]:
        """One page of the store's products with their state on the channel."""
        with translate_transport_errors():
            response = await channel_products_controller_list_products_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_products(
        self, store_id: Id, *, limit: int | None = None, **filters: Unpack[StoreProductFilters]
    ) -> AsyncIterator[ChannelProductDto]:
        """All of the store's matching products. Use with ``async for``."""
        return aiterate_pages(
            lambda cursor: self.list_products(store_id, cursor=cursor, limit=limit, **filters)
        )

    async def list_listings(
        self,
        store_id: Id,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[StoreListingFilters],
    ) -> Page[ChannelListingDto]:
        """One page of the store's listings, most recently changed first."""
        with translate_transport_errors():
            response = await channel_sync_controller_list_listings_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter_listings(
        self, store_id: Id, *, limit: int | None = None, **filters: Unpack[StoreListingFilters]
    ) -> AsyncIterator[ChannelListingDto]:
        """All of the store's matching listings. Use with ``async for``."""
        return aiterate_pages(
            lambda cursor: self.list_listings(store_id, cursor=cursor, limit=limit, **filters)
        )
