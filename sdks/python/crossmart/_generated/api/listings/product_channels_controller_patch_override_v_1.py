from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.listing_override_patch_dto import ListingOverridePatchDto
from ...models.product_channel_dto import ProductChannelDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    body: ListingOverridePatchDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/channels/{connection_id}/override".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ProductChannelDto | None:
    if response.status_code == 200:
        response_200 = ProductChannelDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ProductChannelDto]:
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
    body: ListingOverridePatchDto,
) -> Response[ProductChannelDto]:
    """Change some of the product’s overrides on one channel

     Absent fields keep their override; null reverts a field to the product’s value. Each `variantPrices`
    entry replaces that variant’s prices only, and both prices null revert the variant to the pricing
    rule. When the channel already lists the product, an update is queued.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        body (ListingOverridePatchDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductChannelDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        body=body,
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
    body: ListingOverridePatchDto,
) -> ProductChannelDto | None:
    """Change some of the product’s overrides on one channel

     Absent fields keep their override; null reverts a field to the product’s value. Each `variantPrices`
    entry replaces that variant’s prices only, and both prices null revert the variant to the pricing
    rule. When the channel already lists the product, an update is queued.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        body (ListingOverridePatchDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductChannelDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ListingOverridePatchDto,
) -> Response[ProductChannelDto]:
    """Change some of the product’s overrides on one channel

     Absent fields keep their override; null reverts a field to the product’s value. Each `variantPrices`
    entry replaces that variant’s prices only, and both prices null revert the variant to the pricing
    rule. When the channel already lists the product, an update is queued.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        body (ListingOverridePatchDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductChannelDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ListingOverridePatchDto,
) -> ProductChannelDto | None:
    """Change some of the product’s overrides on one channel

     Absent fields keep their override; null reverts a field to the product’s value. Each `variantPrices`
    entry replaces that variant’s prices only, and both prices null revert the variant to the pricing
    rule. When the channel already lists the product, an update is queued.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):
        body (ListingOverridePatchDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductChannelDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            connection_id=connection_id,
            client=client,
            body=body,
        )
    ).parsed
