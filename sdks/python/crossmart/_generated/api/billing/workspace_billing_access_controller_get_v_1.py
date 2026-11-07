from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.subscription_access_dto import SubscriptionAccessDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/billing-access".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> SubscriptionAccessDto | None:
    if response.status_code == 200:
        response_200 = SubscriptionAccessDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[SubscriptionAccessDto]:
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
) -> Response[SubscriptionAccessDto]:
    """Whether the workspace can be changed under its organization’s subscription

     For anyone in the workspace, including API keys and agents. While `writable` is false and `enforced`
    is true, changes answer 402 `subscription_inactive`: ask a billing admin of the organization (owners
    and admins) to fix the subscription.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SubscriptionAccessDto]
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
    client: AuthenticatedClient | Client,
) -> SubscriptionAccessDto | None:
    """Whether the workspace can be changed under its organization’s subscription

     For anyone in the workspace, including API keys and agents. While `writable` is false and `enforced`
    is true, changes answer 402 `subscription_inactive`: ask a billing admin of the organization (owners
    and admins) to fix the subscription.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SubscriptionAccessDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[SubscriptionAccessDto]:
    """Whether the workspace can be changed under its organization’s subscription

     For anyone in the workspace, including API keys and agents. While `writable` is false and `enforced`
    is true, changes answer 402 `subscription_inactive`: ask a billing admin of the organization (owners
    and admins) to fix the subscription.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SubscriptionAccessDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> SubscriptionAccessDto | None:
    """Whether the workspace can be changed under its organization’s subscription

     For anyone in the workspace, including API keys and agents. While `writable` is false and `enforced`
    is true, changes answer 402 `subscription_inactive`: ask a billing admin of the organization (owners
    and admins) to fix the subscription.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SubscriptionAccessDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
        )
    ).parsed
