from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.catalog_gap import CatalogGap
from ...models.product_page_dto import ProductPageDto
from ...models.product_sort import ProductSort
from ...models.product_status import ProductStatus
from ...models.product_store_filter import ProductStoreFilter
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    search: str | Unset = UNSET,
    status: ProductStatus | Unset = UNSET,
    gap: CatalogGap | Unset = UNSET,
    tags: list[str] | Unset = UNSET,
    vendor: str | Unset = UNSET,
    store_filter: ProductStoreFilter | Unset = UNSET,
    store_id: UUID | Unset = UNSET,
    sort: ProductSort | Unset = ProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["search"] = search

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    json_gap: str | Unset = UNSET
    if not isinstance(gap, Unset):
        json_gap = gap.value

    params["gap"] = json_gap

    json_tags: list[str] | Unset = UNSET
    if not isinstance(tags, Unset):
        json_tags = tags

    params["tags"] = json_tags

    params["vendor"] = vendor

    json_store_filter: str | Unset = UNSET
    if not isinstance(store_filter, Unset):
        json_store_filter = store_filter.value

    params["storeFilter"] = json_store_filter

    json_store_id: str | Unset = UNSET
    if not isinstance(store_id, Unset):
        json_store_id = str(store_id)
    params["storeId"] = json_store_id

    json_sort: str | Unset = UNSET
    if not isinstance(sort, Unset):
        json_sort = sort.value

    params["sort"] = json_sort

    json_direction: str | Unset = UNSET
    if not isinstance(direction, Unset):
        json_direction = direction.value

    params["direction"] = json_direction

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/products".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ProductPageDto | None:
    if response.status_code == 200:
        response_200 = ProductPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ProductPageDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
    status: ProductStatus | Unset = UNSET,
    gap: CatalogGap | Unset = UNSET,
    tags: list[str] | Unset = UNSET,
    vendor: str | Unset = UNSET,
    store_filter: ProductStoreFilter | Unset = UNSET,
    store_id: UUID | Unset = UNSET,
    sort: ProductSort | Unset = ProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[ProductPageDto]:
    """Products of a workspace, in title order

    Args:
        workspace_id (str):
        search (str | Unset):
        status (ProductStatus | Unset):
        gap (CatalogGap | Unset):
        tags (list[str] | Unset):
        vendor (str | Unset):
        store_filter (ProductStoreFilter | Unset):
        store_id (UUID | Unset):
        sort (ProductSort | Unset):  Default: ProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        search=search,
        status=status,
        gap=gap,
        tags=tags,
        vendor=vendor,
        store_filter=store_filter,
        store_id=store_id,
        sort=sort,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
    status: ProductStatus | Unset = UNSET,
    gap: CatalogGap | Unset = UNSET,
    tags: list[str] | Unset = UNSET,
    vendor: str | Unset = UNSET,
    store_filter: ProductStoreFilter | Unset = UNSET,
    store_id: UUID | Unset = UNSET,
    sort: ProductSort | Unset = ProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> ProductPageDto | None:
    """Products of a workspace, in title order

    Args:
        workspace_id (str):
        search (str | Unset):
        status (ProductStatus | Unset):
        gap (CatalogGap | Unset):
        tags (list[str] | Unset):
        vendor (str | Unset):
        store_filter (ProductStoreFilter | Unset):
        store_id (UUID | Unset):
        sort (ProductSort | Unset):  Default: ProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        search=search,
        status=status,
        gap=gap,
        tags=tags,
        vendor=vendor,
        store_filter=store_filter,
        store_id=store_id,
        sort=sort,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
    status: ProductStatus | Unset = UNSET,
    gap: CatalogGap | Unset = UNSET,
    tags: list[str] | Unset = UNSET,
    vendor: str | Unset = UNSET,
    store_filter: ProductStoreFilter | Unset = UNSET,
    store_id: UUID | Unset = UNSET,
    sort: ProductSort | Unset = ProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[ProductPageDto]:
    """Products of a workspace, in title order

    Args:
        workspace_id (str):
        search (str | Unset):
        status (ProductStatus | Unset):
        gap (CatalogGap | Unset):
        tags (list[str] | Unset):
        vendor (str | Unset):
        store_filter (ProductStoreFilter | Unset):
        store_id (UUID | Unset):
        sort (ProductSort | Unset):  Default: ProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        search=search,
        status=status,
        gap=gap,
        tags=tags,
        vendor=vendor,
        store_filter=store_filter,
        store_id=store_id,
        sort=sort,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
    status: ProductStatus | Unset = UNSET,
    gap: CatalogGap | Unset = UNSET,
    tags: list[str] | Unset = UNSET,
    vendor: str | Unset = UNSET,
    store_filter: ProductStoreFilter | Unset = UNSET,
    store_id: UUID | Unset = UNSET,
    sort: ProductSort | Unset = ProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> ProductPageDto | None:
    """Products of a workspace, in title order

    Args:
        workspace_id (str):
        search (str | Unset):
        status (ProductStatus | Unset):
        gap (CatalogGap | Unset):
        tags (list[str] | Unset):
        vendor (str | Unset):
        store_filter (ProductStoreFilter | Unset):
        store_id (UUID | Unset):
        sort (ProductSort | Unset):  Default: ProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            search=search,
            status=status,
            gap=gap,
            tags=tags,
            vendor=vendor,
            store_filter=store_filter,
            store_id=store_id,
            sort=sort,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
