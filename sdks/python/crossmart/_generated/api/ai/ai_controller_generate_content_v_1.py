from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.content_generation_receipt_dto import ContentGenerationReceiptDto
from ...models.generate_content_dto import GenerateContentDto
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
) -> ContentGenerationReceiptDto | None:
    if response.status_code == 202:
        response_202 = ContentGenerationReceiptDto.from_dict(response.json())

        return response_202

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ContentGenerationReceiptDto]:
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
) -> Response[ContentGenerationReceiptDto]:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Answers 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ContentGenerationReceiptDto]
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
) -> ContentGenerationReceiptDto | None:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Answers 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ContentGenerationReceiptDto
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
) -> Response[ContentGenerationReceiptDto]:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Answers 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ContentGenerationReceiptDto]
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
) -> ContentGenerationReceiptDto | None:
    """Generate channel content with AI

     Queues the Content Generator for each product: it writes a title and description fitted to the
    store’s channel. The results arrive as pending suggestions to review; nothing changes until one is
    approved. Answers 503 while AI is not configured.

    Args:
        workspace_id (str):
        body (GenerateContentDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ContentGenerationReceiptDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
