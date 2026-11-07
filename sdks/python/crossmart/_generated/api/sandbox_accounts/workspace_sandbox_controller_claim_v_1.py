from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.claimed_sandbox_dto import ClaimedSandboxDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/sandbox/claim".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | ClaimedSandboxDto | None:
    if response.status_code == 200:
        response_200 = ClaimedSandboxDto.from_dict(response.json())

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
) -> Response[Any | ClaimedSandboxDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient,
) -> Response[Any | ClaimedSandboxDto]:
    """Claim this sandbox account as its owner

     For the person the sandbox was opened for, signed in (a password reset link is the only other way
    in, and it proves the address too). Makes the workspace a normal one. API keys and agents get 403;
    anyone else, or a workspace with nothing to claim, 404.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ClaimedSandboxDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient,
) -> Any | ClaimedSandboxDto | None:
    """Claim this sandbox account as its owner

     For the person the sandbox was opened for, signed in (a password reset link is the only other way
    in, and it proves the address too). Makes the workspace a normal one. API keys and agents get 403;
    anyone else, or a workspace with nothing to claim, 404.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ClaimedSandboxDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient,
) -> Response[Any | ClaimedSandboxDto]:
    """Claim this sandbox account as its owner

     For the person the sandbox was opened for, signed in (a password reset link is the only other way
    in, and it proves the address too). Makes the workspace a normal one. API keys and agents get 403;
    anyone else, or a workspace with nothing to claim, 404.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ClaimedSandboxDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient,
) -> Any | ClaimedSandboxDto | None:
    """Claim this sandbox account as its owner

     For the person the sandbox was opened for, signed in (a password reset link is the only other way
    in, and it proves the address too). Makes the workspace a normal one. API keys and agents get 403;
    anyone else, or a workspace with nothing to claim, 404.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ClaimedSandboxDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
        )
    ).parsed
