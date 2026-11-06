from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.content_draft_dto import ContentDraftDto
from ...models.create_content_draft_dto import CreateContentDraftDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: CreateContentDraftDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/ai/content-drafts".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | ContentDraftDto | PlanLimitErrorDto | None:
    if response.status_code == 200:
        response_200 = ContentDraftDto.from_dict(response.json())

        return response_200

    if response.status_code == 402:
        response_402 = PlanLimitErrorDto.from_dict(response.json())

        return response_402

    if response.status_code == 429:
        response_429 = cast(Any, None)
        return response_429

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | ContentDraftDto | PlanLimitErrorDto]:
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
    body: CreateContentDraftDto,
) -> Response[Any | ContentDraftDto | PlanLimitErrorDto]:
    """Rewrite a product’s title or description with AI, right away

     Rewrites the fields asked for, for the catalog or for one store, optionally following an
    instruction. The answer is a draft for the editor: nothing is stored until the merchant saves it.
    Uses one AI credit: answers 402 when the plan has none left this month (while plans are enforced),
    429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (CreateContentDraftDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ContentDraftDto | PlanLimitErrorDto]
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
    body: CreateContentDraftDto,
) -> Any | ContentDraftDto | PlanLimitErrorDto | None:
    """Rewrite a product’s title or description with AI, right away

     Rewrites the fields asked for, for the catalog or for one store, optionally following an
    instruction. The answer is a draft for the editor: nothing is stored until the merchant saves it.
    Uses one AI credit: answers 402 when the plan has none left this month (while plans are enforced),
    429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (CreateContentDraftDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ContentDraftDto | PlanLimitErrorDto
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
    body: CreateContentDraftDto,
) -> Response[Any | ContentDraftDto | PlanLimitErrorDto]:
    """Rewrite a product’s title or description with AI, right away

     Rewrites the fields asked for, for the catalog or for one store, optionally following an
    instruction. The answer is a draft for the editor: nothing is stored until the merchant saves it.
    Uses one AI credit: answers 402 when the plan has none left this month (while plans are enforced),
    429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (CreateContentDraftDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | ContentDraftDto | PlanLimitErrorDto]
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
    body: CreateContentDraftDto,
) -> Any | ContentDraftDto | PlanLimitErrorDto | None:
    """Rewrite a product’s title or description with AI, right away

     Rewrites the fields asked for, for the catalog or for one store, optionally following an
    instruction. The answer is a draft for the editor: nothing is stored until the merchant saves it.
    Uses one AI credit: answers 402 when the plan has none left this month (while plans are enforced),
    429 past the rate limit, and 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (CreateContentDraftDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | ContentDraftDto | PlanLimitErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
