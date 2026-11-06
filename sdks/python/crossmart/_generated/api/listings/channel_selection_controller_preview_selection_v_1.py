from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.selection_preview_dto import SelectionPreviewDto
from ...models.update_product_selection_dto import UpdateProductSelectionDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
    *,
    body: UpdateProductSelectionDto,
    cursor: UUID | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    params: dict[str, Any] = {}

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/product-selection/preview".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
        "params": params,
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> SelectionPreviewDto | None:
    if response.status_code == 200:
        response_200 = SelectionPreviewDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[SelectionPreviewDto]:
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
    body: UpdateProductSelectionDto,
    cursor: UUID | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[SelectionPreviewDto]:
    """The products a selection lists, with counts, saved or not

    Args:
        workspace_id (str):
        connection_id (str):
        cursor (UUID | Unset):
        limit (float | Unset):  Default: 25.0.
        body (UpdateProductSelectionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SelectionPreviewDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
        cursor=cursor,
        limit=limit,
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
    body: UpdateProductSelectionDto,
    cursor: UUID | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> SelectionPreviewDto | None:
    """The products a selection lists, with counts, saved or not

    Args:
        workspace_id (str):
        connection_id (str):
        cursor (UUID | Unset):
        limit (float | Unset):  Default: 25.0.
        body (UpdateProductSelectionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SelectionPreviewDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
        body=body,
        cursor=cursor,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateProductSelectionDto,
    cursor: UUID | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[SelectionPreviewDto]:
    """The products a selection lists, with counts, saved or not

    Args:
        workspace_id (str):
        connection_id (str):
        cursor (UUID | Unset):
        limit (float | Unset):  Default: 25.0.
        body (UpdateProductSelectionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SelectionPreviewDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
        cursor=cursor,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateProductSelectionDto,
    cursor: UUID | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> SelectionPreviewDto | None:
    """The products a selection lists, with counts, saved or not

    Args:
        workspace_id (str):
        connection_id (str):
        cursor (UUID | Unset):
        limit (float | Unset):  Default: 25.0.
        body (UpdateProductSelectionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SelectionPreviewDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
            body=body,
            cursor=cursor,
            limit=limit,
        )
    ).parsed
