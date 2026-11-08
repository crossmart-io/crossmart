from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_worker_cancel_result_dto import AgentWorkerCancelResultDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    conversation_id: UUID,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/agent-worker/conversations/{conversation_id}/cancel".format(
            workspace_id=quote(str(workspace_id), safe=""),
            conversation_id=quote(str(conversation_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentWorkerCancelResultDto | None:
    if response.status_code == 200:
        response_200 = AgentWorkerCancelResultDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AgentWorkerCancelResultDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[AgentWorkerCancelResultDto]:
    """Stop the running turn

     The model call is aborted; what already ran stays, and nothing more runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerCancelResultDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> AgentWorkerCancelResultDto | None:
    """Stop the running turn

     The model call is aborted; what already ran stays, and nothing more runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerCancelResultDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[AgentWorkerCancelResultDto]:
    """Stop the running turn

     The model call is aborted; what already ran stays, and nothing more runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerCancelResultDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> AgentWorkerCancelResultDto | None:
    """Stop the running turn

     The model call is aborted; what already ran stays, and nothing more runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerCancelResultDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            client=client,
        )
    ).parsed
