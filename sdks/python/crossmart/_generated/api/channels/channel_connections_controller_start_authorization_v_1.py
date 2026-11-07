from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.start_authorization_dto import StartAuthorizationDto
from ...models.started_authorization_dto import StartedAuthorizationDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: StartAuthorizationDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/authorizations".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
    | None
):
    if response.status_code == 201:
        response_201 = StartedAuthorizationDto.from_dict(response.json())

        return response_201

    if response.status_code == 402:

        def _parse_response_402(
            data: object,
        ) -> PlanLimitErrorDto | SubscriptionInactiveErrorDto:
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                response_402_type_0 = PlanLimitErrorDto.from_dict(data)

                return response_402_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            if not isinstance(data, dict):
                raise TypeError()
            response_402_type_1 = SubscriptionInactiveErrorDto.from_dict(data)

            return response_402_type_1

        response_402 = _parse_response_402(response.json())

        return response_402

    if response.status_code == 403:
        response_403 = SandboxRestrictedErrorDto.from_dict(response.json())

        return response_403

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: StartAuthorizationDto,
) -> Response[
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
]:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user, and the browser must store the
    cookie this response sets (send it with credentials): the callback only accepts the same browser and
    session that started the connection.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | StartedAuthorizationDto]
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
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: StartAuthorizationDto,
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
    | None
):
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user, and the browser must store the
    cookie this response sets (send it with credentials): the callback only accepts the same browser and
    session that started the connection.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | StartedAuthorizationDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: StartAuthorizationDto,
) -> Response[
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
]:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user, and the browser must store the
    cookie this response sets (send it with credentials): the callback only accepts the same browser and
    session that started the connection.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | StartedAuthorizationDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: StartAuthorizationDto,
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | StartedAuthorizationDto
    | None
):
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user, and the browser must store the
    cookie this response sets (send it with credentials): the callback only accepts the same browser and
    session that started the connection.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | StartedAuthorizationDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
