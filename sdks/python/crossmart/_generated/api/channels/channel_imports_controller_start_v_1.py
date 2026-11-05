from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.import_job_detail_dto import ImportJobDetailDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/imports".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ImportJobDetailDto | None:
    if response.status_code == 202:
        response_202 = ImportJobDetailDto.from_dict(response.json())

        return response_202

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ImportJobDetailDto]:
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
) -> Response[ImportJobDetailDto]:
    """Import the connected channel’s catalog

     Queues an import of every product of the channel account. Products already linked to it are
    refreshed, products that match the catalog by handle or SKU are linked, and the rest are created
    with their stock. Returns the import history entry; poll it with `GET /import-jobs/{jobId}` to
    follow the progress. While an import of the connection runs, this returns that import instead of
    starting another. 409 when the connection is not connected.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
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
) -> ImportJobDetailDto | None:
    """Import the connected channel’s catalog

     Queues an import of every product of the channel account. Products already linked to it are
    refreshed, products that match the catalog by handle or SKU are linked, and the rest are created
    with their stock. Returns the import history entry; poll it with `GET /import-jobs/{jobId}` to
    follow the progress. While an import of the connection runs, this returns that import instead of
    starting another. 409 when the connection is not connected.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobDetailDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ImportJobDetailDto]:
    """Import the connected channel’s catalog

     Queues an import of every product of the channel account. Products already linked to it are
    refreshed, products that match the catalog by handle or SKU are linked, and the rest are created
    with their stock. Returns the import history entry; poll it with `GET /import-jobs/{jobId}` to
    follow the progress. While an import of the connection runs, this returns that import instead of
    starting another. 409 when the connection is not connected.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> ImportJobDetailDto | None:
    """Import the connected channel’s catalog

     Queues an import of every product of the channel account. Products already linked to it are
    refreshed, products that match the catalog by handle or SKU are linked, and the rest are created
    with their stock. Returns the import history entry; poll it with `GET /import-jobs/{jobId}` to
    follow the progress. While an import of the connection runs, this returns that import instead of
    starting another. 409 when the connection is not connected.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobDetailDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
        )
    ).parsed
