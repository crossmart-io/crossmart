from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.channel_category_dto import ChannelCategoryDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    search: str | Unset = UNSET,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["search"] = search

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/channels/{connection_id}/category-suggestions".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> list[ChannelCategoryDto] | None:
    if response.status_code == 200:
        response_200 = []
        _response_200 = response.json()
        for response_200_item_data in _response_200:
            response_200_item = ChannelCategoryDto.from_dict(response_200_item_data)

            response_200.append(response_200_item)

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[list[ChannelCategoryDto]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
) -> Response[list[ChannelCategoryDto]]:
    """Suggest channel categories for the product

     Searches the channel’s categories for `search`, or for the product’s title.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        search (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[ChannelCategoryDto]]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        search=search,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
) -> list[ChannelCategoryDto] | None:
    """Suggest channel categories for the product

     Searches the channel’s categories for `search`, or for the product’s title.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        search (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[ChannelCategoryDto]
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        client=client,
        search=search,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
) -> Response[list[ChannelCategoryDto]]:
    """Suggest channel categories for the product

     Searches the channel’s categories for `search`, or for the product’s title.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        search (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[ChannelCategoryDto]]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        search=search,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    search: str | Unset = UNSET,
) -> list[ChannelCategoryDto] | None:
    """Suggest channel categories for the product

     Searches the channel’s categories for `search`, or for the product’s title.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        search (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[ChannelCategoryDto]
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            connection_id=connection_id,
            client=client,
            search=search,
        )
    ).parsed
