from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_proposal_dto import AgentProposalDto
from ...models.decide_agent_proposal_dto import DecideAgentProposalDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    body: DecideAgentProposalDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/agent-proposals/{proposal_id}/approve".format(
            workspace_id=quote(str(workspace_id), safe=""),
            proposal_id=quote(str(proposal_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentProposalDto | None:
    if response.status_code == 200:
        response_200 = AgentProposalDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AgentProposalDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentProposalDto,
) -> Response[AgentProposalDto]:
    """Approve a proposal: the change is made as the agent, approved by you

     Needs the permission the change itself needs too. A proposal with risks needs `confirmHighRisk`. 409
    when it no longer waits (decided or expired).

    Args:
        workspace_id (UUID):
        proposal_id (UUID):
        body (DecideAgentProposalDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        proposal_id=proposal_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentProposalDto,
) -> AgentProposalDto | None:
    """Approve a proposal: the change is made as the agent, approved by you

     Needs the permission the change itself needs too. A proposal with risks needs `confirmHighRisk`. 409
    when it no longer waits (decided or expired).

    Args:
        workspace_id (UUID):
        proposal_id (UUID):
        body (DecideAgentProposalDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        proposal_id=proposal_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentProposalDto,
) -> Response[AgentProposalDto]:
    """Approve a proposal: the change is made as the agent, approved by you

     Needs the permission the change itself needs too. A proposal with risks needs `confirmHighRisk`. 409
    when it no longer waits (decided or expired).

    Args:
        workspace_id (UUID):
        proposal_id (UUID):
        body (DecideAgentProposalDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        proposal_id=proposal_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: DecideAgentProposalDto,
) -> AgentProposalDto | None:
    """Approve a proposal: the change is made as the agent, approved by you

     Needs the permission the change itself needs too. A proposal with risks needs `confirmHighRisk`. 409
    when it no longer waits (decided or expired).

    Args:
        workspace_id (UUID):
        proposal_id (UUID):
        body (DecideAgentProposalDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            proposal_id=proposal_id,
            client=client,
            body=body,
        )
    ).parsed
