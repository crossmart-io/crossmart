from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.listing_retry_error_dto import ListingRetryErrorDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.product_channel_dto import ProductChannelDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/products/{product_id}/channels/{connection_id}/retry".format(
            workspace_id=quote(str(workspace_id), safe=""),
            product_id=quote(str(product_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> (
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
    | None
):
    if response.status_code == 202:
        response_202 = ProductChannelDto.from_dict(response.json())

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

    if response.status_code == 404:
        response_404 = cast(Any, None)
        return response_404

    if response.status_code == 409:
        response_409 = ListingRetryErrorDto.from_dict(response.json())

        return response_409

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
]:
    """Publish the product to one store again

     Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, which resyncs
    the whole store. A failed or delisted listing becomes pending at once, so the answer shows
    `displayState: publishing`; the job runs in the background. Refused (409) when the store is not
    connected (`code: store_not_connected`: it needs re-auth or was disconnected) or does not select the
    product (`code: product_not_in_store`), and (402) when the plan has no room for another active
    listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ListingRetryErrorDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | ProductChannelDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> (
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
    | None
):
    """Publish the product to one store again

     Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, which resyncs
    the whole store. A failed or delisted listing becomes pending at once, so the answer shows
    `displayState: publishing`; the job runs in the background. Refused (409) when the store is not
    connected (`code: store_not_connected`: it needs re-auth or was disconnected) or does not select the
    product (`code: product_not_in_store`), and (402) when the plan has no room for another active
    listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ListingRetryErrorDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | ProductChannelDto | SandboxRestrictedErrorDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> Response[
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
]:
    """Publish the product to one store again

     Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, which resyncs
    the whole store. A failed or delisted listing becomes pending at once, so the answer shows
    `displayState: publishing`; the job runs in the background. Refused (409) when the store is not
    connected (`code: store_not_connected`: it needs re-auth or was disconnected) or does not select the
    product (`code: product_not_in_store`), and (402) when the plan has no room for another active
    listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ListingRetryErrorDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | ProductChannelDto | SandboxRestrictedErrorDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        product_id=product_id,
        connection_id=connection_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: UUID,
    product_id: UUID,
    connection_id: UUID,
    *,
    client: AuthenticatedClient | Client,
) -> (
    Any
    | ListingRetryErrorDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | ProductChannelDto
    | SandboxRestrictedErrorDto
    | None
):
    """Publish the product to one store again

     Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, which resyncs
    the whole store. A failed or delisted listing becomes pending at once, so the answer shows
    `displayState: publishing`; the job runs in the background. Refused (409) when the store is not
    connected (`code: store_not_connected`: it needs re-auth or was disconnected) or does not select the
    product (`code: product_not_in_store`), and (402) when the plan has no room for another active
    listing.

    Args:
        workspace_id (UUID):
        product_id (UUID):
        connection_id (UUID):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ListingRetryErrorDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | ProductChannelDto | SandboxRestrictedErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            product_id=product_id,
            connection_id=connection_id,
            client=client,
        )
    ).parsed
