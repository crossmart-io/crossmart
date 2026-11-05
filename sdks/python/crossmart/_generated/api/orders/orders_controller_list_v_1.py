from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.order_page_dto import OrderPageDto
from ...models.order_status import OrderStatus
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    status: OrderStatus | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    search: str | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    json_connection_id: str | Unset = UNSET
    if not isinstance(connection_id, Unset):
        json_connection_id = str(connection_id)
    params["connectionId"] = json_connection_id

    params["search"] = search

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
        "url": "/api/v1/workspaces/{workspace_id}/orders".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> OrderPageDto | None:
    if response.status_code == 200:
        response_200 = OrderPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[OrderPageDto]:
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
    status: OrderStatus | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    search: str | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[OrderPageDto]:
    """Orders from every connected store, newest first

     Orders hold no buyer details. Each line shows the stock it holds.

    Args:
        workspace_id (str):
        status (OrderStatus | Unset):
        connection_id (UUID | Unset):
        search (str | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OrderPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        connection_id=connection_id,
        search=search,
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
    status: OrderStatus | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    search: str | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> OrderPageDto | None:
    """Orders from every connected store, newest first

     Orders hold no buyer details. Each line shows the stock it holds.

    Args:
        workspace_id (str):
        status (OrderStatus | Unset):
        connection_id (UUID | Unset):
        search (str | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OrderPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        status=status,
        connection_id=connection_id,
        search=search,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: OrderStatus | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    search: str | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[OrderPageDto]:
    """Orders from every connected store, newest first

     Orders hold no buyer details. Each line shows the stock it holds.

    Args:
        workspace_id (str):
        status (OrderStatus | Unset):
        connection_id (UUID | Unset):
        search (str | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OrderPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        connection_id=connection_id,
        search=search,
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
    status: OrderStatus | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    search: str | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> OrderPageDto | None:
    """Orders from every connected store, newest first

     Orders hold no buyer details. Each line shows the stock it holds.

    Args:
        workspace_id (str):
        status (OrderStatus | Unset):
        connection_id (UUID | Unset):
        search (str | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OrderPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            status=status,
            connection_id=connection_id,
            search=search,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
