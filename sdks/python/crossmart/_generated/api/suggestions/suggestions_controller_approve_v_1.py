from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.suggestion_dto import SuggestionDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    suggestion_id: UUID,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/suggestions/{suggestion_id}/approve".format(
            workspace_id=quote(str(workspace_id), safe=""),
            suggestion_id=quote(str(suggestion_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> SuggestionDto | None:
    if response.status_code == 200:
        response_200 = SuggestionDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[SuggestionDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    suggestion_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[SuggestionDto]:
    """Approve a suggestion

     Applies the change the way an edit would (a channel override, synced to the store), and returns it
    `APPLIED`. When its field changed since it was made, nothing is applied and it returns `STALE`. A
    suggestion that is no longer pending answers 409.

    Args:
        workspace_id (UUID):
        suggestion_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SuggestionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        suggestion_id=suggestion_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    suggestion_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> SuggestionDto | None:
    """Approve a suggestion

     Applies the change the way an edit would (a channel override, synced to the store), and returns it
    `APPLIED`. When its field changed since it was made, nothing is applied and it returns `STALE`. A
    suggestion that is no longer pending answers 409.

    Args:
        workspace_id (UUID):
        suggestion_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SuggestionDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        suggestion_id=suggestion_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    suggestion_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[SuggestionDto]:
    """Approve a suggestion

     Applies the change the way an edit would (a channel override, synced to the store), and returns it
    `APPLIED`. When its field changed since it was made, nothing is applied and it returns `STALE`. A
    suggestion that is no longer pending answers 409.

    Args:
        workspace_id (UUID):
        suggestion_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SuggestionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        suggestion_id=suggestion_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    suggestion_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> SuggestionDto | None:
    """Approve a suggestion

     Applies the change the way an edit would (a channel override, synced to the store), and returns it
    `APPLIED`. When its field changed since it was made, nothing is applied and it returns `STALE`. A
    suggestion that is no longer pending answers 409.

    Args:
        workspace_id (UUID):
        suggestion_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SuggestionDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            suggestion_id=suggestion_id,
            client=client,
        )
    ).parsed
