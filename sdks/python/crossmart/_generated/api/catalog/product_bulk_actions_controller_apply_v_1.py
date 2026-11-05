from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.bulk_product_action_dto import BulkProductActionDto
from ...models.bulk_product_result_dto import BulkProductResultDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: BulkProductActionDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/product-bulk-actions".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> BulkProductResultDto | None:
    if response.status_code == 200:
        response_200 = BulkProductResultDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[BulkProductResultDto]:
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
    body: BulkProductActionDto,
) -> Response[BulkProductResultDto]:
    """Change many products at once

     Set a status, add or remove tags, move every variant price by a percentage, or delete. Each action
    runs as one statement, scoped to the workspace.

    Args:
        workspace_id (str):
        body (BulkProductActionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[BulkProductResultDto]
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
    body: BulkProductActionDto,
) -> BulkProductResultDto | None:
    """Change many products at once

     Set a status, add or remove tags, move every variant price by a percentage, or delete. Each action
    runs as one statement, scoped to the workspace.

    Args:
        workspace_id (str):
        body (BulkProductActionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        BulkProductResultDto
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
    body: BulkProductActionDto,
) -> Response[BulkProductResultDto]:
    """Change many products at once

     Set a status, add or remove tags, move every variant price by a percentage, or delete. Each action
    runs as one statement, scoped to the workspace.

    Args:
        workspace_id (str):
        body (BulkProductActionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[BulkProductResultDto]
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
    body: BulkProductActionDto,
) -> BulkProductResultDto | None:
    """Change many products at once

     Set a status, add or remove tags, move every variant price by a percentage, or delete. Each action
    runs as one statement, scoped to the workspace.

    Args:
        workspace_id (str):
        body (BulkProductActionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        BulkProductResultDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
