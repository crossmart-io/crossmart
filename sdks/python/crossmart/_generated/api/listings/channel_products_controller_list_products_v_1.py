from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.channel_product_page_dto import ChannelProductPageDto
from ...models.channel_product_sort import ChannelProductSort
from ...models.channel_product_state import ChannelProductState
from ...models.listing_display_state import ListingDisplayState
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
    *,
    state: ChannelProductState | Unset = UNSET,
    display_state: ListingDisplayState | Unset = UNSET,
    search: str | Unset = UNSET,
    sort: ChannelProductSort | Unset = ChannelProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_state: str | Unset = UNSET
    if not isinstance(state, Unset):
        json_state = state.value

    params["state"] = json_state

    json_display_state: str | Unset = UNSET
    if not isinstance(display_state, Unset):
        json_display_state = display_state.value

    params["displayState"] = json_display_state

    params["search"] = search

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
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/products".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ChannelProductPageDto | None:
    if response.status_code == 200:
        response_200 = ChannelProductPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ChannelProductPageDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    state: ChannelProductState | Unset = UNSET,
    display_state: ListingDisplayState | Unset = UNSET,
    search: str | Unset = UNSET,
    sort: ChannelProductSort | Unset = ChannelProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[ChannelProductPageDto]:
    """The store’s products with their state on the channel

     Products the store should have or still has: listed, pending (being published), failed or removing
    (being delisted). Pass `state=excluded` for the catalog products it does not have. `displayState`
    narrows them to the state a merchant reads (`needs_details`, `ready`, …). Counts per state follow
    `search`, so they can label filter tabs.

    Args:
        workspace_id (str):
        connection_id (str):
        state (ChannelProductState | Unset):
        display_state (ListingDisplayState | Unset): The product on this store, in one state
            computed by the server: `draft` (not selected for the store), `needs_details` (selected,
            but the store setup or the product lacks something publishing needs), `ready`
            (publishable, not sent yet), `publishing` (queued or in flight, including an update of a
            published listing that a sync or retry queued), `published`, `failed`, `removing` (being
            taken off) or `removed`.
        search (str | Unset):
        sort (ChannelProductSort | Unset):  Default: ChannelProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChannelProductPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        state=state,
        display_state=display_state,
        search=search,
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
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    state: ChannelProductState | Unset = UNSET,
    display_state: ListingDisplayState | Unset = UNSET,
    search: str | Unset = UNSET,
    sort: ChannelProductSort | Unset = ChannelProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> ChannelProductPageDto | None:
    """The store’s products with their state on the channel

     Products the store should have or still has: listed, pending (being published), failed or removing
    (being delisted). Pass `state=excluded` for the catalog products it does not have. `displayState`
    narrows them to the state a merchant reads (`needs_details`, `ready`, …). Counts per state follow
    `search`, so they can label filter tabs.

    Args:
        workspace_id (str):
        connection_id (str):
        state (ChannelProductState | Unset):
        display_state (ListingDisplayState | Unset): The product on this store, in one state
            computed by the server: `draft` (not selected for the store), `needs_details` (selected,
            but the store setup or the product lacks something publishing needs), `ready`
            (publishable, not sent yet), `publishing` (queued or in flight, including an update of a
            published listing that a sync or retry queued), `published`, `failed`, `removing` (being
            taken off) or `removed`.
        search (str | Unset):
        sort (ChannelProductSort | Unset):  Default: ChannelProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChannelProductPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
        state=state,
        display_state=display_state,
        search=search,
        sort=sort,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    state: ChannelProductState | Unset = UNSET,
    display_state: ListingDisplayState | Unset = UNSET,
    search: str | Unset = UNSET,
    sort: ChannelProductSort | Unset = ChannelProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[ChannelProductPageDto]:
    """The store’s products with their state on the channel

     Products the store should have or still has: listed, pending (being published), failed or removing
    (being delisted). Pass `state=excluded` for the catalog products it does not have. `displayState`
    narrows them to the state a merchant reads (`needs_details`, `ready`, …). Counts per state follow
    `search`, so they can label filter tabs.

    Args:
        workspace_id (str):
        connection_id (str):
        state (ChannelProductState | Unset):
        display_state (ListingDisplayState | Unset): The product on this store, in one state
            computed by the server: `draft` (not selected for the store), `needs_details` (selected,
            but the store setup or the product lacks something publishing needs), `ready`
            (publishable, not sent yet), `publishing` (queued or in flight, including an update of a
            published listing that a sync or retry queued), `published`, `failed`, `removing` (being
            taken off) or `removed`.
        search (str | Unset):
        sort (ChannelProductSort | Unset):  Default: ChannelProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChannelProductPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        state=state,
        display_state=display_state,
        search=search,
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
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    state: ChannelProductState | Unset = UNSET,
    display_state: ListingDisplayState | Unset = UNSET,
    search: str | Unset = UNSET,
    sort: ChannelProductSort | Unset = ChannelProductSort.TITLE,
    direction: SortDirection | Unset = SortDirection.ASC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> ChannelProductPageDto | None:
    """The store’s products with their state on the channel

     Products the store should have or still has: listed, pending (being published), failed or removing
    (being delisted). Pass `state=excluded` for the catalog products it does not have. `displayState`
    narrows them to the state a merchant reads (`needs_details`, `ready`, …). Counts per state follow
    `search`, so they can label filter tabs.

    Args:
        workspace_id (str):
        connection_id (str):
        state (ChannelProductState | Unset):
        display_state (ListingDisplayState | Unset): The product on this store, in one state
            computed by the server: `draft` (not selected for the store), `needs_details` (selected,
            but the store setup or the product lacks something publishing needs), `ready`
            (publishable, not sent yet), `publishing` (queued or in flight, including an update of a
            published listing that a sync or retry queued), `published`, `failed`, `removing` (being
            taken off) or `removed`.
        search (str | Unset):
        sort (ChannelProductSort | Unset):  Default: ChannelProductSort.TITLE.
        direction (SortDirection | Unset):  Default: SortDirection.ASC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChannelProductPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
            state=state,
            display_state=display_state,
            search=search,
            sort=sort,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
