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
    job_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/import-jobs/{job_id}".format(
            workspace_id=quote(str(workspace_id), safe=""),
            job_id=quote(str(job_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ImportJobDetailDto | None:
    if response.status_code == 200:
        response_200 = ImportJobDetailDto.from_dict(response.json())

        return response_200

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
    job_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ImportJobDetailDto]:
    """An import with its skipped and failed records

    Args:
        workspace_id (str):
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        job_id=job_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    job_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> ImportJobDetailDto | None:
    """An import with its skipped and failed records

    Args:
        workspace_id (str):
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobDetailDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        job_id=job_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    job_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[ImportJobDetailDto]:
    """An import with its skipped and failed records

    Args:
        workspace_id (str):
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ImportJobDetailDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        job_id=job_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    job_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> ImportJobDetailDto | None:
    """An import with its skipped and failed records

    Args:
        workspace_id (str):
        job_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ImportJobDetailDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            job_id=job_id,
            client=client,
        )
    ).parsed
