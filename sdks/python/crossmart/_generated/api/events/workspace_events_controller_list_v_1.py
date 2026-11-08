from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.workspace_event_page_dto import WorkspaceEventPageDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: Any,
    *,
    after: str | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["after"] = after

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/events".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | WorkspaceEventPageDto | None:
    if response.status_code == 200:
        response_200 = WorkspaceEventPageDto.from_dict(response.json())

        return response_200

    if response.status_code == 429:
        response_429 = cast(Any, None)
        return response_429

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | WorkspaceEventPageDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Response[Any | WorkspaceEventPageDto]:
    """What happened in the workspace, oldest first, after a cursor

     Without `after`, the latest events. Poll with the `cursor` of the previous page to follow the
    workspace without a stream; the newest second or two is held back so nothing is skipped. 400 for a
    cursor this API did not give out.

    Args:
        workspace_id (Any):
        after (str | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WorkspaceEventPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        after=after,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Any | WorkspaceEventPageDto | None:
    """What happened in the workspace, oldest first, after a cursor

     Without `after`, the latest events. Poll with the `cursor` of the previous page to follow the
    workspace without a stream; the newest second or two is held back so nothing is skipped. 400 for a
    cursor this API did not give out.

    Args:
        workspace_id (Any):
        after (str | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WorkspaceEventPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        after=after,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Response[Any | WorkspaceEventPageDto]:
    """What happened in the workspace, oldest first, after a cursor

     Without `after`, the latest events. Poll with the `cursor` of the previous page to follow the
    workspace without a stream; the newest second or two is held back so nothing is skipped. 400 for a
    cursor this API did not give out.

    Args:
        workspace_id (Any):
        after (str | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WorkspaceEventPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        after=after,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    limit: float | Unset = 50.0,
) -> Any | WorkspaceEventPageDto | None:
    """What happened in the workspace, oldest first, after a cursor

     Without `after`, the latest events. Poll with the `cursor` of the previous page to follow the
    workspace without a stream; the newest second or two is held back so nothing is skipped. 400 for a
    cursor this API did not give out.

    Args:
        workspace_id (Any):
        after (str | Unset):
        limit (float | Unset):  Default: 50.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WorkspaceEventPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            after=after,
            limit=limit,
        )
    ).parsed
