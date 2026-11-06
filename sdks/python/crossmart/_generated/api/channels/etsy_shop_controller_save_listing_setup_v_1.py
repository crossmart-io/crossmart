from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.channel_connection_dto import ChannelConnectionDto
from ...models.update_etsy_listing_setup_dto import UpdateEtsyListingSetupDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
    *,
    body: UpdateEtsyListingSetupDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "put",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/etsy/listing-setup".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ChannelConnectionDto | None:
    if response.status_code == 200:
        response_200 = ChannelConnectionDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ChannelConnectionDto]:
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
    body: UpdateEtsyListingSetupDto,
) -> Response[ChannelConnectionDto]:
    """Set an Etsy connection’s listing setup

     Who made the items, when, whether they are supplies, and the shop’s shipping and processing profiles
    every listing uses. Etsy requires all of them for physical listings.

    Args:
        workspace_id (str):
        connection_id (str):
        body (UpdateEtsyListingSetupDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChannelConnectionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
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
    body: UpdateEtsyListingSetupDto,
) -> ChannelConnectionDto | None:
    """Set an Etsy connection’s listing setup

     Who made the items, when, whether they are supplies, and the shop’s shipping and processing profiles
    every listing uses. Etsy requires all of them for physical listings.

    Args:
        workspace_id (str):
        connection_id (str):
        body (UpdateEtsyListingSetupDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChannelConnectionDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateEtsyListingSetupDto,
) -> Response[ChannelConnectionDto]:
    """Set an Etsy connection’s listing setup

     Who made the items, when, whether they are supplies, and the shop’s shipping and processing profiles
    every listing uses. Etsy requires all of them for physical listings.

    Args:
        workspace_id (str):
        connection_id (str):
        body (UpdateEtsyListingSetupDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ChannelConnectionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateEtsyListingSetupDto,
) -> ChannelConnectionDto | None:
    """Set an Etsy connection’s listing setup

     Who made the items, when, whether they are supplies, and the shop’s shipping and processing profiles
    every listing uses. Etsy requires all of them for physical listings.

    Args:
        workspace_id (str):
        connection_id (str):
        body (UpdateEtsyListingSetupDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ChannelConnectionDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
            body=body,
        )
    ).parsed
