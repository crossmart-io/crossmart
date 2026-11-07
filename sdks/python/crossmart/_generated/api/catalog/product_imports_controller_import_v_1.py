from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.catalog_import_result_dto import CatalogImportResultDto
from ...models.product_imports_controller_import_v1_body import (
    ProductImportsControllerImportV1Body,
)
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: ProductImportsControllerImportV1Body,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/product-imports".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["files"] = body.to_multipart()

    headers["Content-Type"] = "multipart/form-data; boundary=+++"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> CatalogImportResultDto | SandboxRestrictedErrorDto | None:
    if response.status_code == 201:
        response_201 = CatalogImportResultDto.from_dict(response.json())

        return response_201

    if response.status_code == 403:
        response_403 = SandboxRestrictedErrorDto.from_dict(response.json())

        return response_403

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[CatalogImportResultDto | SandboxRestrictedErrorDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImportsControllerImportV1Body,
) -> Response[CatalogImportResultDto | SandboxRestrictedErrorDto]:
    """Import products or stock from a file

     In `create` mode, products whose handle is already in the catalog are skipped, never overwritten. In
    `update` mode, products are found by handle and only the columns in the file change: a missing
    column keeps its value, an empty cell clears it. Variants are matched by SKU, then by option values,
    and are never deleted; stock is left as it is. In `inventory` mode, a `sku,available` CSV sets the
    stock of tracked variants. Invalid records are reported; the rest are applied. Every import is
    recorded in the import history. Product modes need `products:edit`, `inventory` needs
    `inventory:edit`.

    Args:
        workspace_id (str):
        body (ProductImportsControllerImportV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CatalogImportResultDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImportsControllerImportV1Body,
) -> CatalogImportResultDto | SandboxRestrictedErrorDto | None:
    """Import products or stock from a file

     In `create` mode, products whose handle is already in the catalog are skipped, never overwritten. In
    `update` mode, products are found by handle and only the columns in the file change: a missing
    column keeps its value, an empty cell clears it. Variants are matched by SKU, then by option values,
    and are never deleted; stock is left as it is. In `inventory` mode, a `sku,available` CSV sets the
    stock of tracked variants. Invalid records are reported; the rest are applied. Every import is
    recorded in the import history. Product modes need `products:edit`, `inventory` needs
    `inventory:edit`.

    Args:
        workspace_id (str):
        body (ProductImportsControllerImportV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CatalogImportResultDto | SandboxRestrictedErrorDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImportsControllerImportV1Body,
) -> Response[CatalogImportResultDto | SandboxRestrictedErrorDto]:
    """Import products or stock from a file

     In `create` mode, products whose handle is already in the catalog are skipped, never overwritten. In
    `update` mode, products are found by handle and only the columns in the file change: a missing
    column keeps its value, an empty cell clears it. Variants are matched by SKU, then by option values,
    and are never deleted; stock is left as it is. In `inventory` mode, a `sku,available` CSV sets the
    stock of tracked variants. Invalid records are reported; the rest are applied. Every import is
    recorded in the import history. Product modes need `products:edit`, `inventory` needs
    `inventory:edit`.

    Args:
        workspace_id (str):
        body (ProductImportsControllerImportV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[CatalogImportResultDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImportsControllerImportV1Body,
) -> CatalogImportResultDto | SandboxRestrictedErrorDto | None:
    """Import products or stock from a file

     In `create` mode, products whose handle is already in the catalog are skipped, never overwritten. In
    `update` mode, products are found by handle and only the columns in the file change: a missing
    column keeps its value, an empty cell clears it. Variants are matched by SKU, then by option values,
    and are never deleted; stock is left as it is. In `inventory` mode, a `sku,available` CSV sets the
    stock of tracked variants. Invalid records are reported; the rest are applied. Every import is
    recorded in the import history. Product modes need `products:edit`, `inventory` needs
    `inventory:edit`.

    Args:
        workspace_id (str):
        body (ProductImportsControllerImportV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        CatalogImportResultDto | SandboxRestrictedErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
