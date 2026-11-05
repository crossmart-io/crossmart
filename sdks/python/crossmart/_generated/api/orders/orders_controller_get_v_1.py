from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.order_detail_dto import OrderDetailDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    order_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/orders/{order_id}".format(
            workspace_id=quote(str(workspace_id), safe=""),
            order_id=quote(str(order_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> OrderDetailDto | None:
    if response.status_code == 200:
        response_200 = OrderDetailDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[OrderDetailDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    order_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[OrderDetailDto]:
    """One order with its lines and the stock each holds

    Args:
        workspace_id (str):
        order_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OrderDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        order_id=order_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    order_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> OrderDetailDto | None:
    """One order with its lines and the stock each holds

    Args:
        workspace_id (str):
        order_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OrderDetailDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        order_id=order_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    order_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[OrderDetailDto]:
    """One order with its lines and the stock each holds

    Args:
        workspace_id (str):
        order_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[OrderDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        order_id=order_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    order_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> OrderDetailDto | None:
    """One order with its lines and the stock each holds

    Args:
        workspace_id (str):
        order_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        OrderDetailDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            order_id=order_id,
            client=client,
        )
    ).parsed
