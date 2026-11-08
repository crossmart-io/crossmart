from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_worker_stream_event_dto import AgentWorkerStreamEventDto
from ...models.decide_agent_worker_actions_dto import DecideAgentWorkerActionsDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    body: DecideAgentWorkerActionsDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/agent-worker/conversations/{conversation_id}/decision".format(
            workspace_id=quote(str(workspace_id), safe=""),
            conversation_id=quote(str(conversation_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentWorkerStreamEventDto | Any | None:
    if response.status_code == 200:
        response_200 = AgentWorkerStreamEventDto.from_dict(response.text)

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
) -> Response[AgentWorkerStreamEventDto | Any]:
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
    body: DecideAgentWorkerActionsDto,
) -> Response[AgentWorkerStreamEventDto | Any]:
    """Approve or reject the changes waiting in a conversation, and stream the result

     Approves the listed actions and rejects every other waiting one, in one step. Approved changes are
    made through the API as "Agent Worker on behalf of" you, then Agent Worker goes on with their
    results. Actions with `risks` (deletions, price changes, bulk changes) also need `confirmHighRisk`:
    400 without it. 409 when nothing waits or a turn runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (DecideAgentWorkerActionsDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerStreamEventDto | Any]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        body=body,
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
    body: DecideAgentWorkerActionsDto,
) -> AgentWorkerStreamEventDto | Any | None:
    """Approve or reject the changes waiting in a conversation, and stream the result

     Approves the listed actions and rejects every other waiting one, in one step. Approved changes are
    made through the API as "Agent Worker on behalf of" you, then Agent Worker goes on with their
    results. Actions with `risks` (deletions, price changes, bulk changes) also need `confirmHighRisk`:
    400 without it. 409 when nothing waits or a turn runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (DecideAgentWorkerActionsDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerStreamEventDto | Any
    """

    return sync_detailed(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentWorkerActionsDto,
) -> Response[AgentWorkerStreamEventDto | Any]:
    """Approve or reject the changes waiting in a conversation, and stream the result

     Approves the listed actions and rejects every other waiting one, in one step. Approved changes are
    made through the API as "Agent Worker on behalf of" you, then Agent Worker goes on with their
    results. Actions with `risks` (deletions, price changes, bulk changes) also need `confirmHighRisk`:
    400 without it. 409 when nothing waits or a turn runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (DecideAgentWorkerActionsDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerStreamEventDto | Any]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        conversation_id=conversation_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentWorkerActionsDto,
) -> AgentWorkerStreamEventDto | Any | None:
    """Approve or reject the changes waiting in a conversation, and stream the result

     Approves the listed actions and rejects every other waiting one, in one step. Approved changes are
    made through the API as "Agent Worker on behalf of" you, then Agent Worker goes on with their
    results. Actions with `risks` (deletions, price changes, bulk changes) also need `confirmHighRisk`:
    400 without it. 409 when nothing waits or a turn runs.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (DecideAgentWorkerActionsDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerStreamEventDto | Any
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            client=client,
            body=body,
        )
    ).parsed
