from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.webhook_delivery_dto import WebhookDeliveryDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    endpoint_id: str,
    delivery_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/webhook-endpoints/{endpoint_id}/deliveries/{delivery_id}/redeliver".format(
            workspace_id=quote(str(workspace_id), safe=""),
            endpoint_id=quote(str(endpoint_id), safe=""),
            delivery_id=quote(str(delivery_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> WebhookDeliveryDto | None:
    if response.status_code == 202:
        response_202 = WebhookDeliveryDto.from_dict(response.json())

        return response_202

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[WebhookDeliveryDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    endpoint_id: str,
    delivery_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[WebhookDeliveryDto]:
    """Send a delivery’s event again

     A new delivery of the same event, with the same event id, sent right away.

    Args:
        workspace_id (str):
        endpoint_id (str):
        delivery_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[WebhookDeliveryDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        delivery_id=delivery_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    endpoint_id: str,
    delivery_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> WebhookDeliveryDto | None:
    """Send a delivery’s event again

     A new delivery of the same event, with the same event id, sent right away.

    Args:
        workspace_id (str):
        endpoint_id (str):
        delivery_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        WebhookDeliveryDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        delivery_id=delivery_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    endpoint_id: str,
    delivery_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[WebhookDeliveryDto]:
    """Send a delivery’s event again

     A new delivery of the same event, with the same event id, sent right away.

    Args:
        workspace_id (str):
        endpoint_id (str):
        delivery_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[WebhookDeliveryDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        delivery_id=delivery_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    endpoint_id: str,
    delivery_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> WebhookDeliveryDto | None:
    """Send a delivery’s event again

     A new delivery of the same event, with the same event id, sent right away.

    Args:
        workspace_id (str):
        endpoint_id (str):
        delivery_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        WebhookDeliveryDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            endpoint_id=endpoint_id,
            delivery_id=delivery_id,
            client=client,
        )
    ).parsed
