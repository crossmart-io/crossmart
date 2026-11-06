"""Products in stores: publishing, removing and per-store overrides."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

from .._core import AsyncResource, SyncResource
from .._generated.api.listings import (
    product_channels_controller_add_v_1,
    product_channels_controller_clear_override_v_1,
    product_channels_controller_list_v_1,
    product_channels_controller_remove_v_1,
    product_channels_controller_retry_v_1,
    product_channels_controller_save_override_v_1,
    store_products_controller_add_v_1,
    store_products_controller_remove_v_1,
)
from .._generated.models import (
    ListingOverrideDto,
    ProductChannelDto,
    StoreProductsDto,
    StoreProductsResultDto,
)
from .._response import translate_transport_errors, unwrap, unwrap_as
from .._utils import Id, as_model, as_str, as_uuid

ListingOverride = ListingOverrideDto | Mapping[str, Any]
"""A store override as a model, or a mapping in the API's JSON shape."""


def _store_products(product_ids: Iterable[Id]) -> StoreProductsDto:
    return StoreProductsDto(product_ids=[as_uuid(product_id) for product_id in product_ids])


class Listings(SyncResource):
    """Put products in stores, take them out, and change what one store shows.

    A product added by hand stays in the store whatever its automatic selection rule says, and is
    published at once. Removing it delists it at once, and the rule leaves it out from then on.

    Example::

        from crossmart.models import ListingOverrideDto

        client.listings.publish(product_id, store_id)
        client.listings.set_override(
            product_id, store_id, ListingOverrideDto(title="Linen apron | Free shipping")
        )
    """

    def for_product(self, product_id: Id) -> list[ProductChannelDto]:
        """The product on each connected store.

        Each entry has the listing status, channel prices with their explanation, shown stock and
        overrides.
        """
        with translate_transport_errors():
            response = product_channels_controller_list_v_1.sync_detailed(
                self._workspace(), as_str(product_id), client=self._http
            )
        return unwrap(response)

    def publish(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Adds the product to a store and publishes it there at once."""
        with translate_transport_errors():
            response = product_channels_controller_add_v_1.sync_detailed(
                as_uuid(self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    def retry(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Publishes the product to one store again, such as after a failed publish.

        Only this product and store are queued, unlike ``stores.sync``. The listing is pending at
        once (``display_state`` is ``publishing``). Raises a 409 error when the store must be
        connected again or does not include the product, and a 402 when the plan has no room for
        another active listing.
        """
        with translate_transport_errors():
            response = product_channels_controller_retry_v_1.sync_detailed(
                as_uuid(self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap_as(response, ProductChannelDto)

    def remove(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Removes the product from a store. It is delisted there at once."""
        with translate_transport_errors():
            response = product_channels_controller_remove_v_1.sync_detailed(
                as_uuid(self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    def set_override(
        self, product_id: Id, store_id: Id, override: ListingOverride
    ) -> ProductChannelDto:
        """Replaces the product's overrides in one store.

        Overrides cover the title, description, tags, images, visibility, stock buffer, maximum
        quantity and per-variant prices. Absent or ``None`` fields follow the product. When the
        store already lists the product, an update is queued.
        """
        body = as_model(ListingOverrideDto, override)
        with translate_transport_errors():
            response = product_channels_controller_save_override_v_1.sync_detailed(
                as_uuid(self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
                body=body,
            )
        return unwrap(response)

    def clear_override(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Removes the product's overrides in one store, so it follows the product again."""
        with translate_transport_errors():
            response = product_channels_controller_clear_override_v_1.sync_detailed(
                as_uuid(self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    def publish_many(self, store_id: Id, product_ids: Iterable[Id]) -> StoreProductsResultDto:
        """Adds several products to a store and publishes them at once.

        Raises :class:`~crossmart.errors.PlanLimitError`, without changing anything, when the plan
        has no room for the listings they would add.
        """
        with translate_transport_errors():
            response = store_products_controller_add_v_1.sync_detailed(
                self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_store_products(product_ids),
            )
        return unwrap_as(response, StoreProductsResultDto)

    def remove_many(self, store_id: Id, product_ids: Iterable[Id]) -> StoreProductsResultDto:
        """Removes several products from a store. They are delisted at once."""
        with translate_transport_errors():
            response = store_products_controller_remove_v_1.sync_detailed(
                self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_store_products(product_ids),
            )
        return unwrap(response)


class AsyncListings(AsyncResource):
    """The asynchronous counterpart of :class:`Listings`."""

    async def for_product(self, product_id: Id) -> list[ProductChannelDto]:
        """The product on each connected store."""
        with translate_transport_errors():
            response = await product_channels_controller_list_v_1.asyncio_detailed(
                await self._workspace(), as_str(product_id), client=self._http
            )
        return unwrap(response)

    async def publish(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Adds the product to a store and publishes it there at once."""
        with translate_transport_errors():
            response = await product_channels_controller_add_v_1.asyncio_detailed(
                as_uuid(await self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    async def retry(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Publishes the product to one store again. See :meth:`Listings.retry`."""
        with translate_transport_errors():
            response = await product_channels_controller_retry_v_1.asyncio_detailed(
                as_uuid(await self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap_as(response, ProductChannelDto)

    async def remove(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Removes the product from a store. It is delisted there at once."""
        with translate_transport_errors():
            response = await product_channels_controller_remove_v_1.asyncio_detailed(
                as_uuid(await self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    async def set_override(
        self, product_id: Id, store_id: Id, override: ListingOverride
    ) -> ProductChannelDto:
        """Replaces the product's overrides in one store. See :meth:`Listings.set_override`."""
        body = as_model(ListingOverrideDto, override)
        with translate_transport_errors():
            response = await product_channels_controller_save_override_v_1.asyncio_detailed(
                as_uuid(await self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
                body=body,
            )
        return unwrap(response)

    async def clear_override(self, product_id: Id, store_id: Id) -> ProductChannelDto:
        """Removes the product's overrides in one store."""
        with translate_transport_errors():
            response = await product_channels_controller_clear_override_v_1.asyncio_detailed(
                as_uuid(await self._workspace()),
                as_uuid(product_id),
                as_uuid(store_id),
                client=self._http,
            )
        return unwrap(response)

    async def publish_many(self, store_id: Id, product_ids: Iterable[Id]) -> StoreProductsResultDto:
        """Adds several products to a store. See :meth:`Listings.publish_many`."""
        with translate_transport_errors():
            response = await store_products_controller_add_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_store_products(product_ids),
            )
        return unwrap_as(response, StoreProductsResultDto)

    async def remove_many(self, store_id: Id, product_ids: Iterable[Id]) -> StoreProductsResultDto:
        """Removes several products from a store. They are delisted at once."""
        with translate_transport_errors():
            response = await store_products_controller_remove_v_1.asyncio_detailed(
                await self._workspace(),
                as_str(store_id),
                client=self._http,
                body=_store_products(product_ids),
            )
        return unwrap(response)
