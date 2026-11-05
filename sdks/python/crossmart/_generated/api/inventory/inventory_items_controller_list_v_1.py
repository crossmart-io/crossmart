from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.inventory_page_dto import InventoryPageDto
from ...models.inventory_sort import InventorySort
from ...models.sort_direction import SortDirection
from ...models.stock_level import StockLevel
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    search: str | Unset = UNSET,
    stock_level: StockLevel | Unset = UNSET,
    sort: InventorySort | Unset = InventorySort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["search"] = search

    json_stock_level: str | Unset = UNSET
    if not isinstance(stock_level, Unset):
        json_stock_level = stock_level.value

    params["stockLevel"] = json_stock_level

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
        "url": "/api/v1/workspaces/{workspace_id}/inventory-items".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> InventoryPageDto | None:
    if response.status_code == 200:
        response_200 = InventoryPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[InventoryPageDto]:
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
    stock_level: StockLevel | Unset = UNSET,
    sort: InventorySort | Unset = InventorySort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Response[InventoryPageDto]:
    """Stock of every variant, by product title

    Args:
        workspace_id (str):
        search (str | Unset):
        stock_level (StockLevel | Unset):
        sort (InventorySort | Unset):  Default: InventorySort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        search=search,
        stock_level=stock_level,
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
    stock_level: StockLevel | Unset = UNSET,
    sort: InventorySort | Unset = InventorySort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> InventoryPageDto | None:
    """Stock of every variant, by product title

    Args:
        workspace_id (str):
        search (str | Unset):
        stock_level (StockLevel | Unset):
        sort (InventorySort | Unset):  Default: InventorySort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        search=search,
        stock_level=stock_level,
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
    stock_level: StockLevel | Unset = UNSET,
    sort: InventorySort | Unset = InventorySort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Response[InventoryPageDto]:
    """Stock of every variant, by product title

    Args:
        workspace_id (str):
        search (str | Unset):
        stock_level (StockLevel | Unset):
        sort (InventorySort | Unset):  Default: InventorySort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        search=search,
        stock_level=stock_level,
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
    stock_level: StockLevel | Unset = UNSET,
    sort: InventorySort | Unset = InventorySort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> InventoryPageDto | None:
    """Stock of every variant, by product title

    Args:
        workspace_id (str):
        search (str | Unset):
        stock_level (StockLevel | Unset):
        sort (InventorySort | Unset):  Default: InventorySort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            search=search,
            stock_level=stock_level,
            sort=sort,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
