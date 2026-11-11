from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.attention_summary_dto import AttentionSummaryDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    limit: float | Unset = 5.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/attention".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> AttentionSummaryDto | None:
    if response.status_code == 200:
        response_200 = AttentionSummaryDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[AttentionSummaryDto]:
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
    limit: float | Unset = 5.0,
) -> Response[AttentionSummaryDto]:
    """What needs the merchant now

     Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions waiting for
    review: a count and the latest few of each, for Home and a sidebar badge. Counts match the Channels,
    Agent proposals and Suggestions pages. A section is null without the permission its page needs
    (`channels:view` or `suggestions:view`).

    Args:
        workspace_id (str):
        limit (float | Unset):  Default: 5.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AttentionSummaryDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    limit: float | Unset = 5.0,
) -> AttentionSummaryDto | None:
    """What needs the merchant now

     Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions waiting for
    review: a count and the latest few of each, for Home and a sidebar badge. Counts match the Channels,
    Agent proposals and Suggestions pages. A section is null without the permission its page needs
    (`channels:view` or `suggestions:view`).

    Args:
        workspace_id (str):
        limit (float | Unset):  Default: 5.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AttentionSummaryDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    limit: float | Unset = 5.0,
) -> Response[AttentionSummaryDto]:
    """What needs the merchant now

     Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions waiting for
    review: a count and the latest few of each, for Home and a sidebar badge. Counts match the Channels,
    Agent proposals and Suggestions pages. A section is null without the permission its page needs
    (`channels:view` or `suggestions:view`).

    Args:
        workspace_id (str):
        limit (float | Unset):  Default: 5.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[AttentionSummaryDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    limit: float | Unset = 5.0,
) -> AttentionSummaryDto | None:
    """What needs the merchant now

     Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions waiting for
    review: a count and the latest few of each, for Home and a sidebar badge. Counts match the Channels,
    Agent proposals and Suggestions pages. A section is null without the permission its page needs
    (`channels:view` or `suggestions:view`).

    Args:
        workspace_id (str):
        limit (float | Unset):  Default: 5.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        AttentionSummaryDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            limit=limit,
        )
    ).parsed
