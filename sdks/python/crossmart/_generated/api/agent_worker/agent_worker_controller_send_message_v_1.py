from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_worker_stream_event_dto import AgentWorkerStreamEventDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.send_agent_worker_message_dto import SendAgentWorkerMessageDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    conversation_id: UUID,
    *,
    body: SendAgentWorkerMessageDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/agent-worker/conversations/{conversation_id}/messages".format(
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
) -> (
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    if response.status_code == 200:
        response_200 = AgentWorkerStreamEventDto.from_dict(response.text)

        return response_200

    if response.status_code == 402:

        def _parse_response_402(
            data: object,
        ) -> PlanLimitErrorDto | SubscriptionInactiveErrorDto:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_402_type_0 = PlanLimitErrorDto.from_dict(data)

                return response_402_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_402_type_1 = SubscriptionInactiveErrorDto.from_dict(data)

            return response_402_type_1

        response_402 = _parse_response_402(response.text)

        return response_402

    if response.status_code == 403:
        response_403 = SandboxRestrictedErrorDto.from_dict(response.text)

        return response_403

    if response.status_code == 429:
        response_429 = cast(Any, None)
        return response_429

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
]:
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
    body: SendAgentWorkerMessageDto,
) -> Response[
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
]:
    """Send a message and stream Agent Worker’s turn

     Agent Worker reads what it needs right away and proposes changes, which wait for `POST …/decision`.
    Changes still waiting are dropped (expired) by a new message. Each model call uses one AI credit:
    answers 402 when the plan has none left (while plans are enforced), 403 in an unclaimed sandbox, 409
    while a turn runs, 429 past the rate limit, and 503 while AI is not configured. A read-only
    subscription still allows reading; Agent Worker then proposes no changes.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (SendAgentWorkerMessageDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerStreamEventDto | Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto]
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
    body: SendAgentWorkerMessageDto,
) -> (
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    """Send a message and stream Agent Worker’s turn

     Agent Worker reads what it needs right away and proposes changes, which wait for `POST …/decision`.
    Changes still waiting are dropped (expired) by a new message. Each model call uses one AI credit:
    answers 402 when the plan has none left (while plans are enforced), 403 in an unclaimed sandbox, 409
    while a turn runs, 429 past the rate limit, and 503 while AI is not configured. A read-only
    subscription still allows reading; Agent Worker then proposes no changes.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (SendAgentWorkerMessageDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerStreamEventDto | Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto
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
    body: SendAgentWorkerMessageDto,
) -> Response[
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
]:
    """Send a message and stream Agent Worker’s turn

     Agent Worker reads what it needs right away and proposes changes, which wait for `POST …/decision`.
    Changes still waiting are dropped (expired) by a new message. Each model call uses one AI credit:
    answers 402 when the plan has none left (while plans are enforced), 403 in an unclaimed sandbox, 409
    while a turn runs, 429 past the rate limit, and 503 while AI is not configured. A read-only
    subscription still allows reading; Agent Worker then proposes no changes.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (SendAgentWorkerMessageDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentWorkerStreamEventDto | Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto]
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
    body: SendAgentWorkerMessageDto,
) -> (
    AgentWorkerStreamEventDto
    | Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    """Send a message and stream Agent Worker’s turn

     Agent Worker reads what it needs right away and proposes changes, which wait for `POST …/decision`.
    Changes still waiting are dropped (expired) by a new message. Each model call uses one AI credit:
    answers 402 when the plan has none left (while plans are enforced), 403 in an unclaimed sandbox, 409
    while a turn runs, 429 past the rate limit, and 503 while AI is not configured. A read-only
    subscription still allows reading; Agent Worker then proposes no changes.

    Args:
        workspace_id (UUID):
        conversation_id (UUID):
        body (SendAgentWorkerMessageDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentWorkerStreamEventDto | Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            conversation_id=conversation_id,
            client=client,
            body=body,
        )
    ).parsed
