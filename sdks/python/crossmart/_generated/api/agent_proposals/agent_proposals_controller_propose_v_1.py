from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_proposal_submission_dto import AgentProposalSubmissionDto
from ...models.propose_agent_change_dto import ProposeAgentChangeDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    *,
    body: ProposeAgentChangeDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/agent-proposals".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentProposalSubmissionDto | None:
    if response.status_code == 200:
        response_200 = AgentProposalSubmissionDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AgentProposalSubmissionDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ProposeAgentChangeDto,
) -> Response[AgentProposalSubmissionDto]:
    """Propose a change as an outside agent

     For connected agents and MCP sessions. Takes an MCP write tool and its input. When the workspace
    approves agents’ changes, it stores a proposal for the seller and answers `proposed`; otherwise it
    answers `apply_directly` and stores nothing. 400 for a read tool, an unknown one or invalid input;
    403 when the caller could not make the change.

    Args:
        workspace_id (UUID):
        body (ProposeAgentChangeDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalSubmissionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ProposeAgentChangeDto,
) -> AgentProposalSubmissionDto | None:
    """Propose a change as an outside agent

     For connected agents and MCP sessions. Takes an MCP write tool and its input. When the workspace
    approves agents’ changes, it stores a proposal for the seller and answers `proposed`; otherwise it
    answers `apply_directly` and stores nothing. 400 for a read tool, an unknown one or invalid input;
    403 when the caller could not make the change.

    Args:
        workspace_id (UUID):
        body (ProposeAgentChangeDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalSubmissionDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ProposeAgentChangeDto,
) -> Response[AgentProposalSubmissionDto]:
    """Propose a change as an outside agent

     For connected agents and MCP sessions. Takes an MCP write tool and its input. When the workspace
    approves agents’ changes, it stores a proposal for the seller and answers `proposed`; otherwise it
    answers `apply_directly` and stores nothing. 400 for a read tool, an unknown one or invalid input;
    403 when the caller could not make the change.

    Args:
        workspace_id (UUID):
        body (ProposeAgentChangeDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalSubmissionDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    body: ProposeAgentChangeDto,
) -> AgentProposalSubmissionDto | None:
    """Propose a change as an outside agent

     For connected agents and MCP sessions. Takes an MCP write tool and its input. When the workspace
    approves agents’ changes, it stores a proposal for the seller and answers `proposed`; otherwise it
    answers `apply_directly` and stores nothing. 400 for a read tool, an unknown one or invalid input;
    403 when the caller could not make the change.

    Args:
        workspace_id (UUID):
        body (ProposeAgentChangeDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalSubmissionDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
