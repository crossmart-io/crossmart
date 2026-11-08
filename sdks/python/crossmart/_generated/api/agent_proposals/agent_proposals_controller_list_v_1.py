from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_proposal_page_dto import AgentProposalPageDto
from ...models.agent_proposal_status import AgentProposalStatus
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: UUID,
    *,
    status: AgentProposalStatus | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/agent-proposals".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentProposalPageDto | None:
    if response.status_code == 200:
        response_200 = AgentProposalPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AgentProposalPageDto]:
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
    status: AgentProposalStatus | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> Response[AgentProposalPageDto]:
    """Outside agents’ proposals, newest first (signed-in people)

    Args:
        workspace_id (UUID):
        status (AgentProposalStatus | Unset): A pending proposal past its expiry reads as expired
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        page=page,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    status: AgentProposalStatus | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> AgentProposalPageDto | None:
    """Outside agents’ proposals, newest first (signed-in people)

    Args:
        workspace_id (UUID):
        status (AgentProposalStatus | Unset): A pending proposal past its expiry reads as expired
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        status=status,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    status: AgentProposalStatus | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> Response[AgentProposalPageDto]:
    """Outside agents’ proposals, newest first (signed-in people)

    Args:
        workspace_id (UUID):
        status (AgentProposalStatus | Unset): A pending proposal past its expiry reads as expired
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentProposalPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        status=status,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    *,
    client: AuthenticatedClient | Client,
    status: AgentProposalStatus | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 20.0,
) -> AgentProposalPageDto | None:
    """Outside agents’ proposals, newest first (signed-in people)

    Args:
        workspace_id (UUID):
        status (AgentProposalStatus | Unset): A pending proposal past its expiry reads as expired
        page (float | Unset):
        limit (float | Unset):  Default: 20.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentProposalPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            status=status,
            page=page,
            limit=limit,
        )
    ).parsed
