from http import HTTPStatus
from typing import Any, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.sandbox_claim_preview_dto import SandboxClaimPreviewDto
from ...models.sandbox_claim_token_dto import SandboxClaimTokenDto
from ...types import Response


def _get_kwargs(
    *,
    body: SandboxClaimTokenDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/sandbox-claims/preview",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | SandboxClaimPreviewDto | None:
    if response.status_code == 200:
        response_200 = SandboxClaimPreviewDto.from_dict(response.json())

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
) -> Response[Any | SandboxClaimPreviewDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: SandboxClaimTokenDto,
) -> Response[Any | SandboxClaimPreviewDto]:
    """What a claim link is for

     Open to anyone with the link, so the claim page can show it before signing in.

    Args:
        body (SandboxClaimTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | SandboxClaimPreviewDto]
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
    body: SandboxClaimTokenDto,
) -> Any | SandboxClaimPreviewDto | None:
    """What a claim link is for

     Open to anyone with the link, so the claim page can show it before signing in.

    Args:
        body (SandboxClaimTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | SandboxClaimPreviewDto
    """

    return sync_detailed(
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: SandboxClaimTokenDto,
) -> Response[Any | SandboxClaimPreviewDto]:
    """What a claim link is for

     Open to anyone with the link, so the claim page can show it before signing in.

    Args:
        body (SandboxClaimTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | SandboxClaimPreviewDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: SandboxClaimTokenDto,
) -> Any | SandboxClaimPreviewDto | None:
    """What a claim link is for

     Open to anyone with the link, so the claim page can show it before signing in.

    Args:
        body (SandboxClaimTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | SandboxClaimPreviewDto
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
        )
    ).parsed
