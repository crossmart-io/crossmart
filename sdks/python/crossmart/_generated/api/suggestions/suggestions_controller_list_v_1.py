from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.suggestion_kind import SuggestionKind
from ...models.suggestion_page_dto import SuggestionPageDto
from ...models.suggestion_status import SuggestionStatus
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    status: SuggestionStatus | Unset = UNSET,
    product_id: UUID | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    kind: SuggestionKind | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    json_product_id: str | Unset = UNSET
    if not isinstance(product_id, Unset):
        json_product_id = str(product_id)
    params["productId"] = json_product_id

    json_connection_id: str | Unset = UNSET
    if not isinstance(connection_id, Unset):
        json_connection_id = str(connection_id)
    params["connectionId"] = json_connection_id

    json_kind: str | Unset = UNSET
    if not isinstance(kind, Unset):
        json_kind = kind.value

    params["kind"] = json_kind

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/suggestions".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> SuggestionPageDto | None:
    if response.status_code == 200:
        response_200 = SuggestionPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[SuggestionPageDto]:
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
    status: SuggestionStatus | Unset = UNSET,
    product_id: UUID | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    kind: SuggestionKind | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[SuggestionPageDto]:
    """Suggestions, newest first

     Filter by `PENDING` for the inbox.

    Args:
        workspace_id (str):
        status (SuggestionStatus | Unset):
        product_id (UUID | Unset):
        connection_id (UUID | Unset):
        kind (SuggestionKind | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SuggestionPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        product_id=product_id,
        connection_id=connection_id,
        kind=kind,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: SuggestionStatus | Unset = UNSET,
    product_id: UUID | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    kind: SuggestionKind | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> SuggestionPageDto | None:
    """Suggestions, newest first

     Filter by `PENDING` for the inbox.

    Args:
        workspace_id (str):
        status (SuggestionStatus | Unset):
        product_id (UUID | Unset):
        connection_id (UUID | Unset):
        kind (SuggestionKind | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SuggestionPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        status=status,
        product_id=product_id,
        connection_id=connection_id,
        kind=kind,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: SuggestionStatus | Unset = UNSET,
    product_id: UUID | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    kind: SuggestionKind | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[SuggestionPageDto]:
    """Suggestions, newest first

     Filter by `PENDING` for the inbox.

    Args:
        workspace_id (str):
        status (SuggestionStatus | Unset):
        product_id (UUID | Unset):
        connection_id (UUID | Unset):
        kind (SuggestionKind | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SuggestionPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        product_id=product_id,
        connection_id=connection_id,
        kind=kind,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: SuggestionStatus | Unset = UNSET,
    product_id: UUID | Unset = UNSET,
    connection_id: UUID | Unset = UNSET,
    kind: SuggestionKind | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> SuggestionPageDto | None:
    """Suggestions, newest first

     Filter by `PENDING` for the inbox.

    Args:
        workspace_id (str):
        status (SuggestionStatus | Unset):
        product_id (UUID | Unset):
        connection_id (UUID | Unset):
        kind (SuggestionKind | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SuggestionPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            status=status,
            product_id=product_id,
            connection_id=connection_id,
            kind=kind,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
