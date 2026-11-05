from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.catalog_import_format import CatalogImportFormat
from ...models.import_job_page_dto import ImportJobPageDto
from ...models.import_job_status import ImportJobStatus
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    status: ImportJobStatus | Unset = UNSET,
    format_: CatalogImportFormat | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    json_format_: str | Unset = UNSET
    if not isinstance(format_, Unset):
        json_format_ = format_.value

    params["format"] = json_format_

    json_direction: str | Unset = UNSET
    if not isinstance(direction, Unset):
        json_direction = direction.value

    params["direction"] = json_direction

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/import-jobs".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ImportJobPageDto | None:
    if response.status_code == 200:
        response_200 = ImportJobPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ImportJobPageDto]:
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
    status: ImportJobStatus | Unset = UNSET,
    format_: CatalogImportFormat | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> Response[ImportJobPageDto]:
    """Import history of a workspace, newest first

    Args:
        workspace_id (str):
        status (ImportJobStatus | Unset):
        format_ (CatalogImportFormat | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        format_=format_,
        direction=direction,
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
    status: ImportJobStatus | Unset = UNSET,
    format_: CatalogImportFormat | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> ImportJobPageDto | None:
    """Import history of a workspace, newest first

    Args:
        workspace_id (str):
        status (ImportJobStatus | Unset):
        format_ (CatalogImportFormat | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        status=status,
        format_=format_,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: ImportJobStatus | Unset = UNSET,
    format_: CatalogImportFormat | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> Response[ImportJobPageDto]:
    """Import history of a workspace, newest first

    Args:
        workspace_id (str):
        status (ImportJobStatus | Unset):
        format_ (CatalogImportFormat | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        format_=format_,
        direction=direction,
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
    status: ImportJobStatus | Unset = UNSET,
    format_: CatalogImportFormat | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> ImportJobPageDto | None:
    """Import history of a workspace, newest first

    Args:
        workspace_id (str):
        status (ImportJobStatus | Unset):
        format_ (CatalogImportFormat | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            status=status,
            format_=format_,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
