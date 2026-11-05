from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.create_api_key_dto import CreateApiKeyDto
from ...models.issued_api_key_dto import IssuedApiKeyDto
from ...models.plan_limit_error_dto import PlanLimitErrorDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: CreateApiKeyDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/api-keys".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> IssuedApiKeyDto | PlanLimitErrorDto | None:
    if response.status_code == 201:
        response_201 = IssuedApiKeyDto.from_dict(response.json())

        return response_201

    if response.status_code == 402:
        response_402 = PlanLimitErrorDto.from_dict(response.json())

        return response_402

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[IssuedApiKeyDto | PlanLimitErrorDto]:
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
    body: CreateApiKeyDto,
) -> Response[IssuedApiKeyDto | PlanLimitErrorDto]:
    """Create an API key. The secret is returned once.

    Args:
        workspace_id (str):
        body (CreateApiKeyDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[IssuedApiKeyDto | PlanLimitErrorDto]
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
    body: CreateApiKeyDto,
) -> IssuedApiKeyDto | PlanLimitErrorDto | None:
    """Create an API key. The secret is returned once.

    Args:
        workspace_id (str):
        body (CreateApiKeyDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        IssuedApiKeyDto | PlanLimitErrorDto
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
    body: CreateApiKeyDto,
) -> Response[IssuedApiKeyDto | PlanLimitErrorDto]:
    """Create an API key. The secret is returned once.

    Args:
        workspace_id (str):
        body (CreateApiKeyDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[IssuedApiKeyDto | PlanLimitErrorDto]
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
    body: CreateApiKeyDto,
) -> IssuedApiKeyDto | PlanLimitErrorDto | None:
    """Create an API key. The secret is returned once.

    Args:
        workspace_id (str):
        body (CreateApiKeyDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        IssuedApiKeyDto | PlanLimitErrorDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed
