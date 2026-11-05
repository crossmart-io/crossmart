from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.listing_item_specifics_dto import ListingItemSpecificsDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/channels/{connection_id}/item-specifics".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ListingItemSpecificsDto | None:
    if response.status_code == 200:
        response_200 = ListingItemSpecificsDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ListingItemSpecificsDto]:
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
) -> Response[ListingItemSpecificsDto]:
    """Get the listing’s item specifics

     The item specifics the listing’s channel category asks for (none until it has a category), with the
    values set on the listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListingItemSpecificsDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
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
) -> ListingItemSpecificsDto | None:
    """Get the listing’s item specifics

     The item specifics the listing’s channel category asks for (none until it has a category), with the
    values set on the listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListingItemSpecificsDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ListingItemSpecificsDto]:
    """Get the listing’s item specifics

     The item specifics the listing’s channel category asks for (none until it has a category), with the
    values set on the listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ListingItemSpecificsDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> ListingItemSpecificsDto | None:
    """Get the listing’s item specifics

     The item specifics the listing’s channel category asks for (none until it has a category), with the
    values set on the listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ListingItemSpecificsDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            connection_id=connection_id,
            client=client,
        )
    ).parsed
