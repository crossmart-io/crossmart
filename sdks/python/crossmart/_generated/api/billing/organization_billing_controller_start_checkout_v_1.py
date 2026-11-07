from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.hosted_session_dto import HostedSessionDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.start_checkout_dto import StartCheckoutDto
from ...types import Response


def _get_kwargs(
    organization_id: str,
    *,
    body: StartCheckoutDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/organizations/{organization_id}/billing/checkout-sessions".format(
            organization_id=quote(str(organization_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | HostedSessionDto | SandboxRestrictedErrorDto | None:
    if response.status_code == 201:
        response_201 = HostedSessionDto.from_dict(response.json())

        return response_201

    if response.status_code == 400:
        response_400 = cast(Any, None)
        return response_400

    if response.status_code == 403:
        response_403 = SandboxRestrictedErrorDto.from_dict(response.json())

        return response_403

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
) -> Response[Any | HostedSessionDto | SandboxRestrictedErrorDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    organization_id: str,
    *,
    client: AuthenticatedClient,
    body: StartCheckoutDto,
) -> Response[Any | HostedSessionDto | SandboxRestrictedErrorDto]:
    """Start a subscription: a checkout page for a plan and interval

     For people holding `billing:manage` (owners and admins). Answers the URL of the provider’s checkout
    page. The card is collected even for the free trial, which only the organization’s first
    subscription gets, and is charged when it ends. An organization with a live subscription changes it
    in the billing portal instead (409).

    Args:
        organization_id (str):
        body (StartCheckoutDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | HostedSessionDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        organization_id=organization_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    organization_id: str,
    *,
    client: AuthenticatedClient,
    body: StartCheckoutDto,
) -> Any | HostedSessionDto | SandboxRestrictedErrorDto | None:
    """Start a subscription: a checkout page for a plan and interval

     For people holding `billing:manage` (owners and admins). Answers the URL of the provider’s checkout
    page. The card is collected even for the free trial, which only the organization’s first
    subscription gets, and is charged when it ends. An organization with a live subscription changes it
    in the billing portal instead (409).

    Args:
        organization_id (str):
        body (StartCheckoutDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | HostedSessionDto | SandboxRestrictedErrorDto
    """

    return sync_detailed(
        organization_id=organization_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    organization_id: str,
    *,
    client: AuthenticatedClient,
    body: StartCheckoutDto,
) -> Response[Any | HostedSessionDto | SandboxRestrictedErrorDto]:
    """Start a subscription: a checkout page for a plan and interval

     For people holding `billing:manage` (owners and admins). Answers the URL of the provider’s checkout
    page. The card is collected even for the free trial, which only the organization’s first
    subscription gets, and is charged when it ends. An organization with a live subscription changes it
    in the billing portal instead (409).

    Args:
        organization_id (str):
        body (StartCheckoutDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | HostedSessionDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        organization_id=organization_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    organization_id: str,
    *,
    client: AuthenticatedClient,
    body: StartCheckoutDto,
) -> Any | HostedSessionDto | SandboxRestrictedErrorDto | None:
    """Start a subscription: a checkout page for a plan and interval

     For people holding `billing:manage` (owners and admins). Answers the URL of the provider’s checkout
    page. The card is collected even for the free trial, which only the organization’s first
    subscription gets, and is charged when it ends. An organization with a live subscription changes it
    in the billing portal instead (409).

    Args:
        organization_id (str):
        body (StartCheckoutDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | HostedSessionDto | SandboxRestrictedErrorDto
    """

    return (
        await asyncio_detailed(
            organization_id=organization_id,
            client=client,
            body=body,
        )
    ).parsed
