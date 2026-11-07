from http import HTTPStatus
from typing import Any, cast
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.ask_escalation_dto import AskEscalationDto
from ...types import Response


def _get_kwargs(
    escalation_id: str,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/ask/escalations/{escalation_id}".format(
            escalation_id=quote(str(escalation_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | AskEscalationDto | None:
    if response.status_code == 200:
        response_200 = AskEscalationDto.from_dict(response.json())

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
) -> Response[Any | AskEscalationDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    escalation_id: str,
    *,
    client: AuthenticatedClient,
) -> Response[Any | AskEscalationDto]:
    """Read an escalation

     Its status and, once the team answered, the reply. The ticket id returned when the escalation was
    opened is the only credential needed.

    Args:
        escalation_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskEscalationDto]
    """

    kwargs = _get_kwargs(
        escalation_id=escalation_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    escalation_id: str,
    *,
    client: AuthenticatedClient,
) -> Any | AskEscalationDto | None:
    """Read an escalation

     Its status and, once the team answered, the reply. The ticket id returned when the escalation was
    opened is the only credential needed.

    Args:
        escalation_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskEscalationDto
    """

    return sync_detailed(
        escalation_id=escalation_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    escalation_id: str,
    *,
    client: AuthenticatedClient,
) -> Response[Any | AskEscalationDto]:
    """Read an escalation

     Its status and, once the team answered, the reply. The ticket id returned when the escalation was
    opened is the only credential needed.

    Args:
        escalation_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskEscalationDto]
    """

    kwargs = _get_kwargs(
        escalation_id=escalation_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    escalation_id: str,
    *,
    client: AuthenticatedClient,
) -> Any | AskEscalationDto | None:
    """Read an escalation

     Its status and, once the team answered, the reply. The ticket id returned when the escalation was
    opened is the only credential needed.

    Args:
        escalation_id (str):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskEscalationDto
    """

    return (
        await asyncio_detailed(
            escalation_id=escalation_id,
            client=client,
        )
    ).parsed
