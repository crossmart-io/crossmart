from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.sort_direction import SortDirection
from ...models.webhook_delivery_page_dto import WebhookDeliveryPageDto
from ...models.webhook_delivery_status import WebhookDeliveryStatus
from ...models.webhook_event_type import WebhookEventType
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    endpoint_id: str,
    *,
    status: WebhookDeliveryStatus | Unset = UNSET,
    event_type: WebhookEventType | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    json_event_type: str | Unset = UNSET
    if not isinstance(event_type, Unset):
        json_event_type = event_type.value

    params["eventType"] = json_event_type

    json_direction: str | Unset = UNSET
    if not isinstance(direction, Unset):
        json_direction = direction.value

    params["direction"] = json_direction

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/webhook-endpoints/{endpoint_id}/deliveries".format(
            workspace_id=quote(str(workspace_id), safe=""),
            endpoint_id=quote(str(endpoint_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> WebhookDeliveryPageDto | None:
    if response.status_code == 200:
        response_200 = WebhookDeliveryPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[WebhookDeliveryPageDto]:
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
    status: WebhookDeliveryStatus | Unset = UNSET,
    event_type: WebhookEventType | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[WebhookDeliveryPageDto]:
    """The delivery log of a webhook endpoint, newest first

     Deliveries are kept for 30 days.

    Args:
        workspace_id (str):
        endpoint_id (str):
        status (WebhookDeliveryStatus | Unset):
        event_type (WebhookEventType | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[WebhookDeliveryPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        status=status,
        event_type=event_type,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
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
    status: WebhookDeliveryStatus | Unset = UNSET,
    event_type: WebhookEventType | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> WebhookDeliveryPageDto | None:
    """The delivery log of a webhook endpoint, newest first

     Deliveries are kept for 30 days.

    Args:
        workspace_id (str):
        endpoint_id (str):
        status (WebhookDeliveryStatus | Unset):
        event_type (WebhookEventType | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        WebhookDeliveryPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        client=client,
        status=status,
        event_type=event_type,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: WebhookDeliveryStatus | Unset = UNSET,
    event_type: WebhookEventType | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[WebhookDeliveryPageDto]:
    """The delivery log of a webhook endpoint, newest first

     Deliveries are kept for 30 days.

    Args:
        workspace_id (str):
        endpoint_id (str):
        status (WebhookDeliveryStatus | Unset):
        event_type (WebhookEventType | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[WebhookDeliveryPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        endpoint_id=endpoint_id,
        status=status,
        event_type=event_type,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    endpoint_id: str,
    *,
    client: AuthenticatedClient | Client,
    status: WebhookDeliveryStatus | Unset = UNSET,
    event_type: WebhookEventType | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> WebhookDeliveryPageDto | None:
    """The delivery log of a webhook endpoint, newest first

     Deliveries are kept for 30 days.

    Args:
        workspace_id (str):
        endpoint_id (str):
        status (WebhookDeliveryStatus | Unset):
        event_type (WebhookEventType | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        WebhookDeliveryPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            endpoint_id=endpoint_id,
            client=client,
            status=status,
            event_type=event_type,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
