from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.product_channel_dto import ProductChannelDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    product_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/channels".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> list[ProductChannelDto] | None:
    if response.status_code == 200:
        response_200 = []
        _response_200 = response.json()
        for response_200_item_data in _response_200:
            response_200_item = ProductChannelDto.from_dict(response_200_item_data)

            response_200.append(response_200_item)

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[list[ProductChannelDto]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    product_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[list[ProductChannelDto]]:
    """The product on each connected channel

     Listing status, channel prices with their explanation, shown stock and overrides.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[ProductChannelDto]]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    product_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> list[ProductChannelDto] | None:
    """The product on each connected channel

     Listing status, channel prices with their explanation, shown stock and overrides.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[ProductChannelDto]
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    product_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[list[ProductChannelDto]]:
    """The product on each connected channel

     Listing status, channel prices with their explanation, shown stock and overrides.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[ProductChannelDto]]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    product_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> list[ProductChannelDto] | None:
    """The product on each connected channel

     Listing status, channel prices with their explanation, shown stock and overrides.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[ProductChannelDto]
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            client=client,
        )
    ).parsed
