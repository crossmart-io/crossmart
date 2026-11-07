import datetime
from http import HTTPStatus
from typing import Any, cast
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.ask_channel import AskChannel
from ...models.ask_conversation_page_dto import AskConversationPageDto
from ...models.ask_outcome import AskOutcome
from ...types import UNSET, Response, Unset


def _get_kwargs(
    *,
    from_: datetime.datetime | Unset = UNSET,
    to: datetime.datetime | Unset = UNSET,
    outcome: AskOutcome | Unset = UNSET,
    channel: AskChannel | Unset = UNSET,
    escalated: bool | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_from_: str | Unset = UNSET
    if not isinstance(from_, Unset):
        json_from_ = from_.isoformat()
    params["from"] = json_from_

    json_to: str | Unset = UNSET
    if not isinstance(to, Unset):
        json_to = to.isoformat()
    params["to"] = json_to

    json_outcome: str | Unset = UNSET
    if not isinstance(outcome, Unset):
        json_outcome = outcome.value

    params["outcome"] = json_outcome

    json_channel: str | Unset = UNSET
    if not isinstance(channel, Unset):
        json_channel = channel.value

    params["channel"] = json_channel

    params["escalated"] = escalated

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/admin/ask/conversations",
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | AskConversationPageDto | None:
    if response.status_code == 200:
        response_200 = AskConversationPageDto.from_dict(response.json())

        return response_200

    if response.status_code == 404:
        response_404 = cast(Any, None)
        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | AskConversationPageDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient,
    from_: datetime.datetime | Unset = UNSET,
    to: datetime.datetime | Unset = UNSET,
    outcome: AskOutcome | Unset = UNSET,
    channel: AskChannel | Unset = UNSET,
    escalated: bool | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[Any | AskConversationPageDto]:
    """Stored conversations, newest first

    Args:
        from_ (datetime.datetime | Unset):
        to (datetime.datetime | Unset):
        outcome (AskOutcome | Unset): `answered` from the cited pages; `unknown` when the docs do
            not answer it (the answer points to support); `out_of_scope` when it is not about
            Crossmart
        channel (AskChannel | Unset): Where the question comes from, for Crossmart’s statistics
            only
        escalated (bool | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskConversationPageDto]
    """

    kwargs = _get_kwargs(
        from_=from_,
        to=to,
        outcome=outcome,
        channel=channel,
        escalated=escalated,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient,
    from_: datetime.datetime | Unset = UNSET,
    to: datetime.datetime | Unset = UNSET,
    outcome: AskOutcome | Unset = UNSET,
    channel: AskChannel | Unset = UNSET,
    escalated: bool | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Any | AskConversationPageDto | None:
    """Stored conversations, newest first

    Args:
        from_ (datetime.datetime | Unset):
        to (datetime.datetime | Unset):
        outcome (AskOutcome | Unset): `answered` from the cited pages; `unknown` when the docs do
            not answer it (the answer points to support); `out_of_scope` when it is not about
            Crossmart
        channel (AskChannel | Unset): Where the question comes from, for Crossmart’s statistics
            only
        escalated (bool | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskConversationPageDto
    """

    return sync_detailed(
        client=client,
        from_=from_,
        to=to,
        outcome=outcome,
        channel=channel,
        escalated=escalated,
        cursor=cursor,
        page=page,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient,
    from_: datetime.datetime | Unset = UNSET,
    to: datetime.datetime | Unset = UNSET,
    outcome: AskOutcome | Unset = UNSET,
    channel: AskChannel | Unset = UNSET,
    escalated: bool | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[Any | AskConversationPageDto]:
    """Stored conversations, newest first

    Args:
        from_ (datetime.datetime | Unset):
        to (datetime.datetime | Unset):
        outcome (AskOutcome | Unset): `answered` from the cited pages; `unknown` when the docs do
            not answer it (the answer points to support); `out_of_scope` when it is not about
            Crossmart
        channel (AskChannel | Unset): Where the question comes from, for Crossmart’s statistics
            only
        escalated (bool | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskConversationPageDto]
    """

    kwargs = _get_kwargs(
        from_=from_,
        to=to,
        outcome=outcome,
        channel=channel,
        escalated=escalated,
        cursor=cursor,
        page=page,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient,
    from_: datetime.datetime | Unset = UNSET,
    to: datetime.datetime | Unset = UNSET,
    outcome: AskOutcome | Unset = UNSET,
    channel: AskChannel | Unset = UNSET,
    escalated: bool | Unset = UNSET,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Any | AskConversationPageDto | None:
    """Stored conversations, newest first

    Args:
        from_ (datetime.datetime | Unset):
        to (datetime.datetime | Unset):
        outcome (AskOutcome | Unset): `answered` from the cited pages; `unknown` when the docs do
            not answer it (the answer points to support); `out_of_scope` when it is not about
            Crossmart
        channel (AskChannel | Unset): Where the question comes from, for Crossmart’s statistics
            only
        escalated (bool | Unset):
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskConversationPageDto
    """

    return (
        await asyncio_detailed(
            client=client,
            from_=from_,
            to=to,
            outcome=outcome,
            channel=channel,
            escalated=escalated,
            cursor=cursor,
            page=page,
            limit=limit,
        )
    ).parsed
