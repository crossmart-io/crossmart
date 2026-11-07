from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.product_dto import ProductDto
from ...models.update_variant_price_dto import UpdateVariantPriceDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    product_id: UUID,
    variant_id: UUID,
    *,
    body: UpdateVariantPriceDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/variants/{variant_id}".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
            variant_id=quote(str(variant_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ProductDto | None:
    if response.status_code == 200:
        response_200 = ProductDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ProductDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    product_id: UUID,
    variant_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateVariantPriceDto,
) -> Response[ProductDto]:
    """Change one variant’s price or compare-at price

     Changes only the prices sent; the rest of the product stays as it is. Connected stores are updated
    like after any price edit. A null compare-at price removes it.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        variant_id (UUID):
        body (UpdateVariantPriceDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        variant_id=variant_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    product_id: UUID,
    variant_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateVariantPriceDto,
) -> ProductDto | None:
    """Change one variant’s price or compare-at price

     Changes only the prices sent; the rest of the product stays as it is. Connected stores are updated
    like after any price edit. A null compare-at price removes it.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        variant_id (UUID):
        body (UpdateVariantPriceDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        variant_id=variant_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    product_id: UUID,
    variant_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateVariantPriceDto,
) -> Response[ProductDto]:
    """Change one variant’s price or compare-at price

     Changes only the prices sent; the rest of the product stays as it is. Connected stores are updated
    like after any price edit. A null compare-at price removes it.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        variant_id (UUID):
        body (UpdateVariantPriceDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        variant_id=variant_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    product_id: UUID,
    variant_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateVariantPriceDto,
) -> ProductDto | None:
    """Change one variant’s price or compare-at price

     Changes only the prices sent; the rest of the product stays as it is. Connected stores are updated
    like after any price edit. A null compare-at price removes it.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        variant_id (UUID):
        body (UpdateVariantPriceDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            variant_id=variant_id,
            client=client,
            body=body,
        )
    ).parsed
