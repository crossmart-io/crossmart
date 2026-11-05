"""The catalog's products."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterator, Mapping
from typing import Any, TypedDict, Unpack
from uuid import UUID

from .._core import AsyncResource, SyncResource
from .._generated.api.catalog import (
    products_controller_create_v_1,
    products_controller_delete_v_1,
    products_controller_get_v_1,
    products_controller_list_v_1,
    products_controller_update_v_1,
)
from .._generated.models import (
    CatalogGap,
    CreateProductDto,
    ProductDto,
    ProductSort,
    ProductStatus,
    ProductStoreFilter,
    ProductSummaryDto,
    SortDirection,
    UpdateProductDto,
)
from .._response import ensure_success, translate_transport_errors, unwrap
from .._utils import Id, as_model, as_str, optional_uuid, or_unset
from ..pagination import Page, aiterate_pages, iterate_pages


class ProductFilters(TypedDict, total=False):
    """Filters and order of a product list. Every key is optional."""

    search: str
    status: ProductStatus
    gap: CatalogGap
    """Products missing something channels need, such as images or a barcode."""
    tags: list[str]
    vendor: str
    store_filter: ProductStoreFilter
    """With ``store_id``: products in that store, or not in it."""
    store_id: UUID
    sort: ProductSort
    direction: SortDirection


class Products(SyncResource):
    """Create, read, replace and delete products.

    Example::

        from crossmart import Crossmart
        from crossmart.models import CreateProductDto, CreateVariantDto

        client = Crossmart()
        product = client.products.create(
            CreateProductDto(
                title="Linen apron",
                variants=[CreateVariantDto(price="24.00", sku="APR-1")],
            )
        )
    """

    def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[ProductFilters],
    ) -> Page[ProductSummaryDto]:
        """One page of products, in title order unless ``sort`` says otherwise.

        Example::

            page = client.products.list(search="apron", status=ProductStatus.ACTIVE, limit=50)
        """
        with translate_transport_errors():
            response = products_controller_list_v_1.sync_detailed(
                self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[ProductFilters]
    ) -> Iterator[ProductSummaryDto]:
        """Every matching product, fetched page by page. ``limit`` is the page size.

        Example::

            for product in client.products.iter(tags=["summer"]):
                print(product.title)
        """
        return iterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    def get(self, product_id: Id) -> ProductDto:
        """A product with its variants, stock and media."""
        with translate_transport_errors():
            response = products_controller_get_v_1.sync_detailed(
                self._workspace(), as_str(product_id), client=self._http
            )
        return unwrap(response)

    def create(self, product: CreateProductDto | Mapping[str, Any]) -> ProductDto:
        """Creates a product with its variants.

        ``product`` is a :class:`~crossmart.models.CreateProductDto`, or a mapping in the API's
        JSON shape such as ``{"title": "Mug", "variants": [{"price": "12.00"}]}``.
        """
        body = as_model(CreateProductDto, product)
        with translate_transport_errors():
            response = products_controller_create_v_1.sync_detailed(
                self._workspace(), client=self._http, body=body
            )
        return unwrap(response)

    def update(self, product_id: Id, product: UpdateProductDto | Mapping[str, Any]) -> ProductDto:
        """Replaces a product (``PUT``).

        Variants sent with an ``id`` are edited, new ones are added and missing ones are removed.
        Fetch the product first and send it back changed, so nothing is dropped by accident.
        """
        body = as_model(UpdateProductDto, product)
        with translate_transport_errors():
            response = products_controller_update_v_1.sync_detailed(
                self._workspace(), as_str(product_id), client=self._http, body=body
            )
        return unwrap(response)

    def delete(self, product_id: Id) -> None:
        """Deletes a product, its variants and their stock."""
        with translate_transport_errors():
            response = products_controller_delete_v_1.sync_detailed(
                self._workspace(), as_str(product_id), client=self._http
            )
        ensure_success(response)


class AsyncProducts(AsyncResource):
    """The asynchronous counterpart of :class:`Products`."""

    async def list(
        self,
        *,
        cursor: Id | None = None,
        limit: int | None = None,
        **filters: Unpack[ProductFilters],
    ) -> Page[ProductSummaryDto]:
        """One page of products. See :meth:`Products.list`."""
        with translate_transport_errors():
            response = await products_controller_list_v_1.asyncio_detailed(
                await self._workspace(),
                client=self._http,
                cursor=optional_uuid(cursor),
                limit=or_unset(limit),
                **filters,
            )
        page_dto = unwrap(response)
        return Page.from_dto(page_dto)

    def iter(
        self, *, limit: int | None = None, **filters: Unpack[ProductFilters]
    ) -> AsyncIterator[ProductSummaryDto]:
        """Every matching product. Use with ``async for``."""
        return aiterate_pages(lambda cursor: self.list(cursor=cursor, limit=limit, **filters))

    async def get(self, product_id: Id) -> ProductDto:
        """A product with its variants, stock and media."""
        with translate_transport_errors():
            response = await products_controller_get_v_1.asyncio_detailed(
                await self._workspace(), as_str(product_id), client=self._http
            )
        return unwrap(response)

    async def create(self, product: CreateProductDto | Mapping[str, Any]) -> ProductDto:
        """Creates a product with its variants. See :meth:`Products.create`."""
        body = as_model(CreateProductDto, product)
        with translate_transport_errors():
            response = await products_controller_create_v_1.asyncio_detailed(
                await self._workspace(), client=self._http, body=body
            )
        return unwrap(response)

    async def update(
        self, product_id: Id, product: UpdateProductDto | Mapping[str, Any]
    ) -> ProductDto:
        """Replaces a product. See :meth:`Products.update`."""
        body = as_model(UpdateProductDto, product)
        with translate_transport_errors():
            response = await products_controller_update_v_1.asyncio_detailed(
                await self._workspace(), as_str(product_id), client=self._http, body=body
            )
        return unwrap(response)

    async def delete(self, product_id: Id) -> None:
        """Deletes a product, its variants and their stock."""
        with translate_transport_errors():
            response = await products_controller_delete_v_1.asyncio_detailed(
                await self._workspace(), as_str(product_id), client=self._http
            )
        ensure_success(response)
