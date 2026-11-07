from http import HTTPStatus
from typing import Any, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.create_sandbox_account_dto import CreateSandboxAccountDto
from ...models.sandbox_account_dto import SandboxAccountDto
from ...types import Response


def _get_kwargs(
    *,
    body: CreateSandboxAccountDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/sandbox-accounts",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | SandboxAccountDto | None:
    if response.status_code == 200:
        response_200 = SandboxAccountDto.from_dict(response.json())

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
) -> Response[Any | SandboxAccountDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreateSandboxAccountDto,
) -> Response[Any | SandboxAccountDto]:
    """Open a sandbox account for someone without one

     For AI agents: no credentials needed. Opens an account for `email` with a workspace named
    `storeName`, returns an Editor API key for it, and emails the person a link to claim it. Until
    claimed it is a sandbox: products (at most 100), stock and drafts work, but connecting stores,
    publishing, inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed accounts
    are deleted after 14 days. When the address already has an account, nothing is created and no email
    is sent, and the answer is the same whoever owns it: `sign_in_required`. At most 5 calls an hour and
    50 a day per caller address; 429 past those.

    Args:
        body (CreateSandboxAccountDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | SandboxAccountDto]
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
    body: CreateSandboxAccountDto,
) -> Any | SandboxAccountDto | None:
    """Open a sandbox account for someone without one

     For AI agents: no credentials needed. Opens an account for `email` with a workspace named
    `storeName`, returns an Editor API key for it, and emails the person a link to claim it. Until
    claimed it is a sandbox: products (at most 100), stock and drafts work, but connecting stores,
    publishing, inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed accounts
    are deleted after 14 days. When the address already has an account, nothing is created and no email
    is sent, and the answer is the same whoever owns it: `sign_in_required`. At most 5 calls an hour and
    50 a day per caller address; 429 past those.

    Args:
        body (CreateSandboxAccountDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | SandboxAccountDto
    """

    return sync_detailed(
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: CreateSandboxAccountDto,
) -> Response[Any | SandboxAccountDto]:
    """Open a sandbox account for someone without one

     For AI agents: no credentials needed. Opens an account for `email` with a workspace named
    `storeName`, returns an Editor API key for it, and emails the person a link to claim it. Until
    claimed it is a sandbox: products (at most 100), stock and drafts work, but connecting stores,
    publishing, inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed accounts
    are deleted after 14 days. When the address already has an account, nothing is created and no email
    is sent, and the answer is the same whoever owns it: `sign_in_required`. At most 5 calls an hour and
    50 a day per caller address; 429 past those.

    Args:
        body (CreateSandboxAccountDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | SandboxAccountDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: CreateSandboxAccountDto,
) -> Any | SandboxAccountDto | None:
    """Open a sandbox account for someone without one

     For AI agents: no credentials needed. Opens an account for `email` with a workspace named
    `storeName`, returns an Editor API key for it, and emails the person a link to claim it. Until
    claimed it is a sandbox: products (at most 100), stock and drafts work, but connecting stores,
    publishing, inviting people and Crossmart AI answer 403 `sandbox_claim_required`. Unclaimed accounts
    are deleted after 14 days. When the address already has an account, nothing is created and no email
    is sent, and the answer is the same whoever owns it: `sign_in_required`. At most 5 calls an hour and
    50 a day per caller address; 429 past those.

    Args:
        body (CreateSandboxAccountDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | SandboxAccountDto
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
        )
    ).parsed
