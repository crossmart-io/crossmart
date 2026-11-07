from http import HTTPStatus
from typing import Any, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.claim_sandbox_dto import ClaimSandboxDto
from ...models.claimed_sandbox_dto import ClaimedSandboxDto
from ...types import Response


def _get_kwargs(
    *,
    body: ClaimSandboxDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/sandbox-claims",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
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

    if response.status_code == 409:
        response_409 = cast(Any, None)
        return response_409

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
    *,
    client: AuthenticatedClient | Client,
    body: ClaimSandboxDto,
) -> Response[Any | ClaimedSandboxDto]:
    """Claim a sandbox account with a new password

     Sets the password the person signs in with and makes the workspace a normal one. The link works
    once. Sign in with the returned email and the password afterwards. 409 when the person already has a
    password: they sign in and claim from the app instead.

    Args:
        body (ClaimSandboxDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ClaimedSandboxDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient | Client,
    body: ClaimSandboxDto,
) -> Any | ClaimedSandboxDto | None:
    """Claim a sandbox account with a new password

     Sets the password the person signs in with and makes the workspace a normal one. The link works
    once. Sign in with the returned email and the password afterwards. 409 when the person already has a
    password: they sign in and claim from the app instead.

    Args:
        body (ClaimSandboxDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ClaimedSandboxDto
    """

    return sync_detailed(
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: ClaimSandboxDto,
) -> Response[Any | ClaimedSandboxDto]:
    """Claim a sandbox account with a new password

     Sets the password the person signs in with and makes the workspace a normal one. The link works
    once. Sign in with the returned email and the password afterwards. 409 when the person already has a
    password: they sign in and claim from the app instead.

    Args:
        body (ClaimSandboxDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ClaimedSandboxDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: ClaimSandboxDto,
) -> Any | ClaimedSandboxDto | None:
    """Claim a sandbox account with a new password

     Sets the password the person signs in with and makes the workspace a normal one. The link works
    once. Sign in with the returned email and the password afterwards. 409 when the person already has a
    password: they sign in and claim from the app instead.

    Args:
        body (ClaimSandboxDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ClaimedSandboxDto
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
        )
    ).parsed
