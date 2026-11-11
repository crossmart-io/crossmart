from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.product_sale_dto import ProductSaleDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    product_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/mark-sold".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ProductSaleDto | None:
    if response.status_code == 200:
        response_200 = ProductSaleDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ProductSaleDto]:
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
) -> Response[ProductSaleDto]:
    """Mark a product sold

     For an item that sold outside the connected stores, such as a one-of-a-kind item sold in person.
    Sets the available stock of every tracked variant to 0 (logged as sold) and takes the product off
    every connected store, as removing it by hand does, so it cannot sell twice. Idempotent: calling it
    again changes nothing and answers `alreadySold: true`.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductSaleDto]
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
) -> ProductSaleDto | None:
    """Mark a product sold

     For an item that sold outside the connected stores, such as a one-of-a-kind item sold in person.
    Sets the available stock of every tracked variant to 0 (logged as sold) and takes the product off
    every connected store, as removing it by hand does, so it cannot sell twice. Idempotent: calling it
    again changes nothing and answers `alreadySold: true`.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductSaleDto
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
) -> Response[ProductSaleDto]:
    """Mark a product sold

     For an item that sold outside the connected stores, such as a one-of-a-kind item sold in person.
    Sets the available stock of every tracked variant to 0 (logged as sold) and takes the product off
    every connected store, as removing it by hand does, so it cannot sell twice. Idempotent: calling it
    again changes nothing and answers `alreadySold: true`.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ProductSaleDto]
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
) -> ProductSaleDto | None:
    """Mark a product sold

     For an item that sold outside the connected stores, such as a one-of-a-kind item sold in person.
    Sets the available stock of every tracked variant to 0 (logged as sold) and takes the product off
    every connected store, as removing it by hand does, so it cannot sell twice. Idempotent: calling it
    again changes nothing and answers `alreadySold: true`.

    Args:
        workspace_id (str):
        product_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ProductSaleDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            client=client,
        )
    ).parsed
