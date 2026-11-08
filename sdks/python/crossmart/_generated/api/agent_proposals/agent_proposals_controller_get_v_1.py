from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_proposal_dto import AgentProposalDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    proposal_id: UUID,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/agent-proposals/{proposal_id}".format(
            workspace_id=quote(str(workspace_id), safe=""),
            proposal_id=quote(str(proposal_id), safe=""),
        ),
    }

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
) -> Response[AgentProposalDto]:
    """One proposal and where it stands

     People need suggestions:view. An agent or key reads only proposals it made; any other id answers
    404.

    Args:
        workspace_id (UUID):
        proposal_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        proposal_id=proposal_id,
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
) -> AgentProposalDto | None:
    """One proposal and where it stands

     People need suggestions:view. An agent or key reads only proposals it made; any other id answers
    404.

    Args:
        workspace_id (UUID):
        proposal_id (UUID):

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
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[AgentProposalDto]:
    """One proposal and where it stands

     People need suggestions:view. An agent or key reads only proposals it made; any other id answers
    404.

    Args:
        workspace_id (UUID):
        proposal_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        proposal_id=proposal_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    proposal_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> AgentProposalDto | None:
    """One proposal and where it stands

     People need suggestions:view. An agent or key reads only proposals it made; any other id answers
    404.

    Args:
        workspace_id (UUID):
        proposal_id (UUID):

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
        )
    ).parsed
