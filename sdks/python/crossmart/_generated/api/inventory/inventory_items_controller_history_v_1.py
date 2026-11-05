from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.inventory_movement_page_dto import InventoryMovementPageDto
from ...models.inventory_movement_reason import InventoryMovementReason
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    inventory_item_id: str,
    *,
    reason: InventoryMovementReason | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_reason: str | Unset = UNSET
    if not isinstance(reason, Unset):
        json_reason = reason.value

    params["reason"] = json_reason

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
        "url": "/api/v1/workspaces/{workspace_id}/inventory-items/{inventory_item_id}/movements".format(
            workspace_id=quote(str(workspace_id), safe=""),
            inventory_item_id=quote(str(inventory_item_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> InventoryMovementPageDto | None:
    if response.status_code == 200:
        response_200 = InventoryMovementPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[InventoryMovementPageDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    reason: InventoryMovementReason | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[InventoryMovementPageDto]:
    """Stock history of a variant, newest first

    Args:
        workspace_id (str):
        inventory_item_id (str):
        reason (InventoryMovementReason | Unset): One of RECEIVED, CORRECTION, RETURNED, DAMAGED,
            LOST, SOLD. The other reasons are recorded by Crossmart.
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryMovementPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        reason=reason,
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
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    reason: InventoryMovementReason | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> InventoryMovementPageDto | None:
    """Stock history of a variant, newest first

    Args:
        workspace_id (str):
        inventory_item_id (str):
        reason (InventoryMovementReason | Unset): One of RECEIVED, CORRECTION, RETURNED, DAMAGED,
            LOST, SOLD. The other reasons are recorded by Crossmart.
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryMovementPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        client=client,
        reason=reason,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    reason: InventoryMovementReason | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[InventoryMovementPageDto]:
    """Stock history of a variant, newest first

    Args:
        workspace_id (str):
        inventory_item_id (str):
        reason (InventoryMovementReason | Unset): One of RECEIVED, CORRECTION, RETURNED, DAMAGED,
            LOST, SOLD. The other reasons are recorded by Crossmart.
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryMovementPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        reason=reason,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    reason: InventoryMovementReason | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> InventoryMovementPageDto | None:
    """Stock history of a variant, newest first

    Args:
        workspace_id (str):
        inventory_item_id (str):
        reason (InventoryMovementReason | Unset): One of RECEIVED, CORRECTION, RETURNED, DAMAGED,
            LOST, SOLD. The other reasons are recorded by Crossmart.
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryMovementPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            inventory_item_id=inventory_item_id,
            client=client,
            reason=reason,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
