from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.webhook_endpoint_with_secret_dto import WebhookEndpointWithSecretDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    endpoint_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/webhook-endpoints/{endpoint_id}/rotate-secret".format(
            workspace_id=quote(str(workspace_id), safe=""),
            endpoint_id=quote(str(endpoint_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | WebhookEndpointWithSecretDto | None:
    if response.status_code == 200:
        response_200 = WebhookEndpointWithSecretDto.from_dict(response.json())

        return response_200

    if response.status_code == 503:
        response_503 = cast(Any, None)
        return response_503

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | WebhookEndpointWithSecretDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[Any | WebhookEndpointWithSecretDto]:
    """Give a webhook endpoint a new signing secret, returned once

     For 24 hours deliveries are signed with both the new and the old secret (two v1 signatures), so the
    receiver can switch without dropping events.

    Args:
        workspace_id (str):
        endpoint_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WebhookEndpointWithSecretDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Any | WebhookEndpointWithSecretDto | None:
    """Give a webhook endpoint a new signing secret, returned once

     For 24 hours deliveries are signed with both the new and the old secret (two v1 signatures), so the
    receiver can switch without dropping events.

    Args:
        workspace_id (str):
        endpoint_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WebhookEndpointWithSecretDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[Any | WebhookEndpointWithSecretDto]:
    """Give a webhook endpoint a new signing secret, returned once

     For 24 hours deliveries are signed with both the new and the old secret (two v1 signatures), so the
    receiver can switch without dropping events.

    Args:
        workspace_id (str):
        endpoint_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WebhookEndpointWithSecretDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Any | WebhookEndpointWithSecretDto | None:
    """Give a webhook endpoint a new signing secret, returned once

     For 24 hours deliveries are signed with both the new and the old secret (two v1 signatures), so the
    receiver can switch without dropping events.

    Args:
        workspace_id (str):
        endpoint_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WebhookEndpointWithSecretDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            endpoint_id=endpoint_id,
            client=client,
        )
    ).parsed
