from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...models.sync_request_result_dto import SyncRequestResultDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/sync".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | SyncRequestResultDto
    | None
):
    if response.status_code == 202:
        response_202 = SyncRequestResultDto.from_dict(response.json())

        return response_202

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
    | SyncRequestResultDto
]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | SyncRequestResultDto
]:
    """Publish the selected products and sync the connection

     Queues every selected product to be published (or updated when the channel has it) and every listing
    that is no longer selected to be delisted. Jobs run in the background. Each listing it queues is
    marked (`syncRequestedAt`, `displayState: publishing`) until its job finishes; follow them with `GET
    …/sync`. Refused (402) before anything is queued when the plan has no room for the active listings
    it would add.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | SyncRequestResultDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | SyncRequestResultDto
    | None
):
    """Publish the selected products and sync the connection

     Queues every selected product to be published (or updated when the channel has it) and every listing
    that is no longer selected to be delisted. Jobs run in the background. Each listing it queues is
    marked (`syncRequestedAt`, `displayState: publishing`) until its job finishes; follow them with `GET
    …/sync`. Refused (402) before anything is queued when the plan has no room for the active listings
    it would add.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | SyncRequestResultDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | SyncRequestResultDto
]:
    """Publish the selected products and sync the connection

     Queues every selected product to be published (or updated when the channel has it) and every listing
    that is no longer selected to be delisted. Jobs run in the background. Each listing it queues is
    marked (`syncRequestedAt`, `displayState: publishing`) until its job finishes; follow them with `GET
    …/sync`. Refused (402) before anything is queued when the plan has no room for the active listings
    it would add.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | SyncRequestResultDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> (
    PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | SyncRequestResultDto
    | None
):
    """Publish the selected products and sync the connection

     Queues every selected product to be published (or updated when the channel has it) and every listing
    that is no longer selected to be delisted. Jobs run in the background. Each listing it queues is
    marked (`syncRequestedAt`, `displayState: publishing`) until its job finishes; follow them with `GET
    …/sync`. Refused (402) before anything is queued when the plan has no room for the active listings
    it would add.

    Args:
        workspace_id (str):
        connection_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto | SyncRequestResultDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
        )
    ).parsed
