from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.workspace_event_dto import WorkspaceEventDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: Any,
    *,
    after: str | Unset = UNSET,
    last_event_id: str | Unset = UNSET,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}
    if not isinstance(last_event_id, Unset):
        headers["last-event-id"] = last_event_id

    params: dict[str, Any] = {}

    params["after"] = after

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/events/stream".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | WorkspaceEventDto | None:
    if response.status_code == 200:
        response_200 = WorkspaceEventDto.from_dict(response.text)

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
) -> Response[Any | WorkspaceEventDto]:
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
    last_event_id: str | Unset = UNSET,
) -> Response[Any | WorkspaceEventDto]:
    """Follow the workspace as it happens, as server-sent events

     Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with its
    `cursor` as the event id. Without a cursor the stream starts with the latest events. `ready` (its id
    is the cursor) says the backlog is out. A comment every 15 seconds keeps the connection open; the
    stream ends after 10 minutes, and the client reconnects with `Last-Event-ID` to go on where it was.

    Args:
        workspace_id (Any):
        after (str | Unset):
        last_event_id (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WorkspaceEventDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        after=after,
        last_event_id=last_event_id,
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
    last_event_id: str | Unset = UNSET,
) -> Any | WorkspaceEventDto | None:
    """Follow the workspace as it happens, as server-sent events

     Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with its
    `cursor` as the event id. Without a cursor the stream starts with the latest events. `ready` (its id
    is the cursor) says the backlog is out. A comment every 15 seconds keeps the connection open; the
    stream ends after 10 minutes, and the client reconnects with `Last-Event-ID` to go on where it was.

    Args:
        workspace_id (Any):
        after (str | Unset):
        last_event_id (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WorkspaceEventDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        after=after,
        last_event_id=last_event_id,
    ).parsed


async def asyncio_detailed(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    last_event_id: str | Unset = UNSET,
) -> Response[Any | WorkspaceEventDto]:
    """Follow the workspace as it happens, as server-sent events

     Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with its
    `cursor` as the event id. Without a cursor the stream starts with the latest events. `ready` (its id
    is the cursor) says the backlog is out. A comment every 15 seconds keeps the connection open; the
    stream ends after 10 minutes, and the client reconnects with `Last-Event-ID` to go on where it was.

    Args:
        workspace_id (Any):
        after (str | Unset):
        last_event_id (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WorkspaceEventDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        after=after,
        last_event_id=last_event_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: Any,
    *,
    client: AuthenticatedClient | Client,
    after: str | Unset = UNSET,
    last_event_id: str | Unset = UNSET,
) -> Any | WorkspaceEventDto | None:
    """Follow the workspace as it happens, as server-sent events

     Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with its
    `cursor` as the event id. Without a cursor the stream starts with the latest events. `ready` (its id
    is the cursor) says the backlog is out. A comment every 15 seconds keeps the connection open; the
    stream ends after 10 minutes, and the client reconnects with `Last-Event-ID` to go on where it was.

    Args:
        workspace_id (Any):
        after (str | Unset):
        last_event_id (str | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WorkspaceEventDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            after=after,
            last_event_id=last_event_id,
        )
    ).parsed
