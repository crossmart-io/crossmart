from http import HTTPStatus
from typing import Any

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.ask_escalation_record_dto import AskEscalationRecordDto
from ...models.ask_escalation_status import AskEscalationStatus
from ...types import UNSET, Response, Unset


def _get_kwargs(
    *,
    status: AskEscalationStatus | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_status: str | Unset = UNSET
    if not isinstance(status, Unset):
        json_status = status.value

    params["status"] = json_status

    params["limit"] = limit

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/admin/ask/escalations",
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> list[AskEscalationRecordDto] | None:
    if response.status_code == 200:
        response_200 = []
        _response_200 = response.json()
        for response_200_item_data in _response_200:
            response_200_item = AskEscalationRecordDto.from_dict(response_200_item_data)

            response_200.append(response_200_item)

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[list[AskEscalationRecordDto]]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient,
    status: AskEscalationStatus | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[list[AskEscalationRecordDto]]:
    """Escalations, newest first

    Args:
        status (AskEscalationStatus | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[AskEscalationRecordDto]]
    """

    kwargs = _get_kwargs(
        status=status,
        limit=limit,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient,
    status: AskEscalationStatus | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> list[AskEscalationRecordDto] | None:
    """Escalations, newest first

    Args:
        status (AskEscalationStatus | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[AskEscalationRecordDto]
    """

    return sync_detailed(
        client=client,
        status=status,
        limit=limit,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient,
    status: AskEscalationStatus | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> Response[list[AskEscalationRecordDto]]:
    """Escalations, newest first

    Args:
        status (AskEscalationStatus | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[list[AskEscalationRecordDto]]
    """

    kwargs = _get_kwargs(
        status=status,
        limit=limit,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient,
    status: AskEscalationStatus | Unset = UNSET,
    limit: float | Unset = 25.0,
) -> list[AskEscalationRecordDto] | None:
    """Escalations, newest first

    Args:
        status (AskEscalationStatus | Unset):
        limit (float | Unset):  Default: 25.0.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        list[AskEscalationRecordDto]
    """

    return (
        await asyncio_detailed(
            client=client,
            status=status,
            limit=limit,
        )
    ).parsed
