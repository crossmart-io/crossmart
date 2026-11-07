from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.content_generation_receipt_dto import ContentGenerationReceiptDto
from ...models.generate_content_dto import GenerateContentDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...models.sandbox_restricted_error_dto import SandboxRestrictedErrorDto
from ...models.subscription_inactive_error_dto import SubscriptionInactiveErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: GenerateContentDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/ai/content-generations".format(
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
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    if response.status_code == 202:
        response_202 = ContentGenerationReceiptDto.from_dict(response.json())

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

    if response.status_code == 429:
        response_429 = cast(Any, None)
        return response_429

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[
    Any
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
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
    body: GenerateContentDto,
) -> Response[
    Any
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
]:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Each product uses one AI credit: answers 402 when the plan’s credits this month do not
    cover them (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ContentGenerationReceiptDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto]
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
    body: GenerateContentDto,
) -> (
    Any
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Each product uses one AI credit: answers 402 when the plan’s credits this month do not
    cover them (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ContentGenerationReceiptDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto
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
    body: GenerateContentDto,
) -> Response[
    Any
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
]:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Each product uses one AI credit: answers 402 when the plan’s credits this month do not
    cover them (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ContentGenerationReceiptDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto]
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
    body: GenerateContentDto,
) -> (
    Any
    | ContentGenerationReceiptDto
    | PlanLimitErrorDto
    | SubscriptionInactiveErrorDto
    | SandboxRestrictedErrorDto
    | None
):
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Each product uses one AI credit: answers 402 when the plan’s credits this month do not
    cover them (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ContentGenerationReceiptDto | PlanLimitErrorDto | SubscriptionInactiveErrorDto | SandboxRestrictedErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
