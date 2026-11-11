from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.getting_started_dto import GettingStartedDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/getting-started".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> GettingStartedDto | None:
    if response.status_code == 200:
        response_200 = GettingStartedDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[GettingStartedDto]:
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
) -> Response[GettingStartedDto]:
    """Where a new account stands, and what to do next

     Counts of products, stores and live listings, whether the email is confirmed, and the steps to a
    first listing: each says whether it is done, whether the seller (in the app, with a link) or an
    agent (with the tools named) takes it. For agents that connect to an empty workspace.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GettingStartedDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> GettingStartedDto | None:
    """Where a new account stands, and what to do next

     Counts of products, stores and live listings, whether the email is confirmed, and the steps to a
    first listing: each says whether it is done, whether the seller (in the app, with a link) or an
    agent (with the tools named) takes it. For agents that connect to an empty workspace.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GettingStartedDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> Response[GettingStartedDto]:
    """Where a new account stands, and what to do next

     Counts of products, stores and live listings, whether the email is confirmed, and the steps to a
    first listing: each says whether it is done, whether the seller (in the app, with a link) or an
    agent (with the tools named) takes it. For agents that connect to an empty workspace.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[GettingStartedDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
) -> GettingStartedDto | None:
    """Where a new account stands, and what to do next

     Counts of products, stores and live listings, whether the email is confirmed, and the steps to a
    first listing: each says whether it is done, whether the seller (in the app, with a link) or an
    agent (with the tools named) takes it. For agents that connect to an empty workspace.

    Args:
        workspace_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        GettingStartedDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
        )
    ).parsed
