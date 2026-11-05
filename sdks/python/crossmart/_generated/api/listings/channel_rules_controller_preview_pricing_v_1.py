from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.pricing_preview_dto import PricingPreviewDto
from ...models.pricing_preview_request_dto import PricingPreviewRequestDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    connection_id: str,
    *,
    body: PricingPreviewRequestDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/channel-connections/{connection_id}/pricing/preview".format(
            workspace_id=quote(str(workspace_id), safe=""),
            connection_id=quote(str(connection_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> PricingPreviewDto | None:
    if response.status_code == 200:
        response_200 = PricingPreviewDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[PricingPreviewDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PricingPreviewRequestDto,
) -> Response[PricingPreviewDto]:
    """Price a real product with a rule, saved or not

     Without `productId`, the first product of the selection is priced.

    Args:
        workspace_id (str):
        connection_id (str):
        body (PricingPreviewRequestDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PricingPreviewDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PricingPreviewRequestDto,
) -> PricingPreviewDto | None:
    """Price a real product with a rule, saved or not

     Without `productId`, the first product of the selection is priced.

    Args:
        workspace_id (str):
        connection_id (str):
        body (PricingPreviewRequestDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PricingPreviewDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        connection_id=connection_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PricingPreviewRequestDto,
) -> Response[PricingPreviewDto]:
    """Price a real product with a rule, saved or not

     Without `productId`, the first product of the selection is priced.

    Args:
        workspace_id (str):
        connection_id (str):
        body (PricingPreviewRequestDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[PricingPreviewDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        connection_id=connection_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    connection_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: PricingPreviewRequestDto,
) -> PricingPreviewDto | None:
    """Price a real product with a rule, saved or not

     Without `productId`, the first product of the selection is priced.

    Args:
        workspace_id (str):
        connection_id (str):
        body (PricingPreviewRequestDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        PricingPreviewDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            connection_id=connection_id,
            client=client,
            body=body,
        )
    ).parsed
