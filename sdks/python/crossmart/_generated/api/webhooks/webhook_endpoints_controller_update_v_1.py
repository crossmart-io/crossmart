from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.update_webhook_endpoint_dto import UpdateWebhookEndpointDto
from ...models.webhook_endpoint_dto import WebhookEndpointDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    endpoint_id: str,
    *,
    body: UpdateWebhookEndpointDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "patch",
        "url": "/api/v1/workspaces/{workspace_id}/webhook-endpoints/{endpoint_id}".format(
            workspace_id=quote(str(workspace_id), safe=""),
            endpoint_id=quote(str(endpoint_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | WebhookEndpointDto | None:
    if response.status_code == 200:
        response_200 = WebhookEndpointDto.from_dict(response.json())

        return response_200

    if response.status_code == 400:
        response_400 = cast(Any, None)
        return response_400

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | WebhookEndpointDto]:
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
    body: UpdateWebhookEndpointDto,
) -> Response[Any | WebhookEndpointDto]:
    """Change a webhook endpoint, or turn it off or on

     Turning an endpoint off fails what it still had to receive; turning it on clears its failure count.
    Events from while it was off are not sent.

    Args:
        workspace_id (str):
        endpoint_id (str):
        body (UpdateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WebhookEndpointDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        body=body,
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
    body: UpdateWebhookEndpointDto,
) -> Any | WebhookEndpointDto | None:
    """Change a webhook endpoint, or turn it off or on

     Turning an endpoint off fails what it still had to receive; turning it on clears its failure count.
    Events from while it was off are not sent.

    Args:
        workspace_id (str):
        endpoint_id (str):
        body (UpdateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WebhookEndpointDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateWebhookEndpointDto,
) -> Response[Any | WebhookEndpointDto]:
    """Change a webhook endpoint, or turn it off or on

     Turning an endpoint off fails what it still had to receive; turning it on clears its failure count.
    Events from while it was off are not sent.

    Args:
        workspace_id (str):
        endpoint_id (str):
        body (UpdateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | WebhookEndpointDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: UpdateWebhookEndpointDto,
) -> Any | WebhookEndpointDto | None:
    """Change a webhook endpoint, or turn it off or on

     Turning an endpoint off fails what it still had to receive; turning it on clears its failure count.
    Events from while it was off are not sent.

    Args:
        workspace_id (str):
        endpoint_id (str):
        body (UpdateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | WebhookEndpointDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            endpoint_id=endpoint_id,
            client=client,
            body=body,
        )
    ).parsed
