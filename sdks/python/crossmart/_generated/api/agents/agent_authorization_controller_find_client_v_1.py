from http import HTTPStatus
from typing import Any, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.agent_client_dto import AgentClientDto
from ...types import UNSET, Response


def _get_kwargs(
    *,
    client_id: str,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["clientId"] = client_id

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/oauth/client",
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AgentClientDto | Any | None:
    if response.status_code == 200:
        response_200 = AgentClientDto.from_dict(response.json())

        return response_200

    if response.status_code == 404:
        response_404 = cast(Any, None)
        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AgentClientDto | Any]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient,
    client_id: str,
) -> Response[AgentClientDto | Any]:
    """The agent asking for access

     Its name, and what of it Crossmart could verify: the host of a Client ID Metadata Document, or
    nothing for an agent that registered itself. Signed-in users only.

    Args:
        client_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentClientDto | Any]
    """

    kwargs = _get_kwargs(
        client_id=client_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient,
    client_id: str,
) -> AgentClientDto | Any | None:
    """The agent asking for access

     Its name, and what of it Crossmart could verify: the host of a Client ID Metadata Document, or
    nothing for an agent that registered itself. Signed-in users only.

    Args:
        client_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentClientDto | Any
    """

    return sync_detailed(
        client=client,
        client_id=client_id,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient,
    client_id: str,
) -> Response[AgentClientDto | Any]:
    """The agent asking for access

     Its name, and what of it Crossmart could verify: the host of a Client ID Metadata Document, or
    nothing for an agent that registered itself. Signed-in users only.

    Args:
        client_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AgentClientDto | Any]
    """

    kwargs = _get_kwargs(
        client_id=client_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient,
    client_id: str,
) -> AgentClientDto | Any | None:
    """The agent asking for access

     Its name, and what of it Crossmart could verify: the host of a Client ID Metadata Document, or
    nothing for an agent that registered itself. Signed-in users only.

    Args:
        client_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AgentClientDto | Any
    """

    return (
        await asyncio_detailed(
            client=client,
            client_id=client_id,
        )
    ).parsed
