from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.create_webhook_endpoint_dto import CreateWebhookEndpointDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...models.webhook_endpoint_with_secret_dto import WebhookEndpointWithSecretDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: CreateWebhookEndpointDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/webhook-endpoints".format(
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
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
    | None
):
    if response.status_code == 201:
        response_201 = WebhookEndpointWithSecretDto.from_dict(response.json())

        return response_201

    if response.status_code == 400:
        response_400 = cast(Any, None)
        return response_400

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

    if response.status_code == 503:
        response_503 = cast(Any, None)
        return response_503

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
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
    body: CreateWebhookEndpointDto,
) -> Response[
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
]:
    """Add a webhook endpoint. Its signing secret is returned once.

     Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.

    Args:
        workspace_id (str):
        body (CreateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | WebhookEndpointWithSecretDto]
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
    body: CreateWebhookEndpointDto,
) -> (
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
    | None
):
    """Add a webhook endpoint. Its signing secret is returned once.

     Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.

    Args:
        workspace_id (str):
        body (CreateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | WebhookEndpointWithSecretDto
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
    body: CreateWebhookEndpointDto,
) -> Response[
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
]:
    """Add a webhook endpoint. Its signing secret is returned once.

     Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.

    Args:
        workspace_id (str):
        body (CreateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | WebhookEndpointWithSecretDto]
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
    body: CreateWebhookEndpointDto,
) -> (
    Any
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | WebhookEndpointWithSecretDto
    | None
):
    """Add a webhook endpoint. Its signing secret is returned once.

     Events are POSTed to the URL as JSON, signed in the Crossmart-Signature header.

    Args:
        workspace_id (str):
        body (CreateWebhookEndpointDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | PlanLimitErrorDto | SubscriptionInactiveErrorDto | WebhookEndpointWithSecretDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
