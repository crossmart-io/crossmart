from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.adjust_stock_dto import AdjustStockDto
from ...models.inventory_item_dto import InventoryItemDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    inventory_item_id: str,
    *,
    body: AdjustStockDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/inventory-items/{inventory_item_id}/adjustments".format(
            workspace_id=quote(str(workspace_id), safe=""),
            inventory_item_id=quote(str(inventory_item_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> InventoryItemDto | None:
    if response.status_code == 200:
        response_200 = InventoryItemDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[InventoryItemDto]:
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
    body: AdjustStockDto,
) -> Response[InventoryItemDto]:
    """Adjust the stock on hand of a variant

     Adds or removes units, or sets the counted stock, and records the change in the ledger with its
    reason and author. Reserved units are not changed.

    Args:
        workspace_id (str):
        inventory_item_id (str):
        body (AdjustStockDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryItemDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        body=body,
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
    body: AdjustStockDto,
) -> InventoryItemDto | None:
    """Adjust the stock on hand of a variant

     Adds or removes units, or sets the counted stock, and records the change in the ledger with its
    reason and author. Reserved units are not changed.

    Args:
        workspace_id (str):
        inventory_item_id (str):
        body (AdjustStockDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryItemDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdjustStockDto,
) -> Response[InventoryItemDto]:
    """Adjust the stock on hand of a variant

     Adds or removes units, or sets the counted stock, and records the change in the ledger with its
    reason and author. Reserved units are not changed.

    Args:
        workspace_id (str):
        inventory_item_id (str):
        body (AdjustStockDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[InventoryItemDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        inventory_item_id=inventory_item_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    inventory_item_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: AdjustStockDto,
) -> InventoryItemDto | None:
    """Adjust the stock on hand of a variant

     Adds or removes units, or sets the counted stock, and records the change in the ledger with its
    reason and author. Reserved units are not changed.

    Args:
        workspace_id (str):
        inventory_item_id (str):
        body (AdjustStockDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        InventoryItemDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            inventory_item_id=inventory_item_id,
            client=client,
            body=body,
        )
    ).parsed
