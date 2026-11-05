from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.start_authorization_dto import StartAuthorizationDto
from ...models.started_authorization_dto import StartedAuthorizationDto
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
) -> PlanLimitErrorDto | StartedAuthorizationDto | None:
    if response.status_code == 201:
        response_201 = StartedAuthorizationDto.from_dict(response.json())

        return response_201

    if response.status_code == 402:
        response_402 = PlanLimitErrorDto.from_dict(response.json())

        return response_402

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[PlanLimitErrorDto | StartedAuthorizationDto]:
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
) -> Response[PlanLimitErrorDto | StartedAuthorizationDto]:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | StartedAuthorizationDto]
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
) -> PlanLimitErrorDto | StartedAuthorizationDto | None:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | StartedAuthorizationDto
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
) -> Response[PlanLimitErrorDto | StartedAuthorizationDto]:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | StartedAuthorizationDto]
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
) -> PlanLimitErrorDto | StartedAuthorizationDto | None:
    """Start connecting a channel account

     Returns the URL to send the merchant to. After they approve the app, the channel redirects to the
    API, which stores the connection and sends them back to the web app’s Channels page with the
    parameters of `ChannelConnectRedirectDto`. Needs a signed-in user.

    Args:
        workspace_id (str):
        body (StartAuthorizationDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | StartedAuthorizationDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
