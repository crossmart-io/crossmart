from http import HTTPStatus
from typing import Any

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.accepted_invitation_dto import AcceptedInvitationDto
from ...models.invitation_token_dto import InvitationTokenDto
from ...types import Response


def _get_kwargs(
    *,
    body: InvitationTokenDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/invitations/accept",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AcceptedInvitationDto | None:
    if response.status_code == 200:
        response_200 = AcceptedInvitationDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AcceptedInvitationDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient,
    body: InvitationTokenDto,
) -> Response[AcceptedInvitationDto]:
    """Accept an invitation and join its workspace

     Needs a signed-in user whose email is the invited address (403 otherwise).

    Args:
        body (InvitationTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AcceptedInvitationDto]
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
    client: AuthenticatedClient,
    body: InvitationTokenDto,
) -> AcceptedInvitationDto | None:
    """Accept an invitation and join its workspace

     Needs a signed-in user whose email is the invited address (403 otherwise).

    Args:
        body (InvitationTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AcceptedInvitationDto
    """

    return sync_detailed(
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient,
    body: InvitationTokenDto,
) -> Response[AcceptedInvitationDto]:
    """Accept an invitation and join its workspace

     Needs a signed-in user whose email is the invited address (403 otherwise).

    Args:
        body (InvitationTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AcceptedInvitationDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient,
    body: InvitationTokenDto,
) -> AcceptedInvitationDto | None:
    """Accept an invitation and join its workspace

     Needs a signed-in user whose email is the invited address (403 otherwise).

    Args:
        body (InvitationTokenDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AcceptedInvitationDto
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
        )
    ).parsed
