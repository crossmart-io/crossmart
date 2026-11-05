from http import HTTPStatus
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.activity_action import ActivityAction
from ...models.activity_outcome import ActivityOutcome
from ...models.activity_page_dto import ActivityPageDto
from ...models.activity_subject_type import ActivitySubjectType
from ...models.sort_direction import SortDirection
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    action: ActivityAction | Unset = UNSET,
    outcome: ActivityOutcome | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
    subject_type: ActivitySubjectType | Unset = UNSET,
    subject_id: UUID | Unset = UNSET,
    actor_user_id: UUID | Unset = UNSET,
    actor_api_key_id: UUID | Unset = UNSET,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_action: str | Unset = UNSET
    if not isinstance(action, Unset):
        json_action = action.value

    params["action"] = json_action

    json_outcome: str | Unset = UNSET
    if not isinstance(outcome, Unset):
        json_outcome = outcome.value

    params["outcome"] = json_outcome

    json_direction: str | Unset = UNSET
    if not isinstance(direction, Unset):
        json_direction = direction.value

    params["direction"] = json_direction

    json_cursor: str | Unset = UNSET
    if not isinstance(cursor, Unset):
        json_cursor = str(cursor)
    params["cursor"] = json_cursor

    params["page"] = page

    params["limit"] = limit

    json_subject_type: str | Unset = UNSET
    if not isinstance(subject_type, Unset):
        json_subject_type = subject_type.value

    params["subjectType"] = json_subject_type

    json_subject_id: str | Unset = UNSET
    if not isinstance(subject_id, Unset):
        json_subject_id = str(subject_id)
    params["subjectId"] = json_subject_id

    json_actor_user_id: str | Unset = UNSET
    if not isinstance(actor_user_id, Unset):
        json_actor_user_id = str(actor_user_id)
    params["actorUserId"] = json_actor_user_id

    json_actor_api_key_id: str | Unset = UNSET
    if not isinstance(actor_api_key_id, Unset):
        json_actor_api_key_id = str(actor_api_key_id)
    params["actorApiKeyId"] = json_actor_api_key_id

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/activity".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ActivityPageDto | None:
    if response.status_code == 200:
        response_200 = ActivityPageDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ActivityPageDto]:
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
    action: ActivityAction | Unset = UNSET,
    outcome: ActivityOutcome | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
    subject_type: ActivitySubjectType | Unset = UNSET,
    subject_id: UUID | Unset = UNSET,
    actor_user_id: UUID | Unset = UNSET,
    actor_api_key_id: UUID | Unset = UNSET,
) -> Response[ActivityPageDto]:
    """Who changed what in the workspace, newest first

     Includes operations that failed, such as an import that created nothing.

    Args:
        workspace_id (str):
        action (ActivityAction | Unset):
        outcome (ActivityOutcome | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.
        subject_type (ActivitySubjectType | Unset):
        subject_id (UUID | Unset):
        actor_user_id (UUID | Unset):
        actor_api_key_id (UUID | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ActivityPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        action=action,
        outcome=outcome,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
        subject_type=subject_type,
        subject_id=subject_id,
        actor_user_id=actor_user_id,
        actor_api_key_id=actor_api_key_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    action: ActivityAction | Unset = UNSET,
    outcome: ActivityOutcome | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
    subject_type: ActivitySubjectType | Unset = UNSET,
    subject_id: UUID | Unset = UNSET,
    actor_user_id: UUID | Unset = UNSET,
    actor_api_key_id: UUID | Unset = UNSET,
) -> ActivityPageDto | None:
    """Who changed what in the workspace, newest first

     Includes operations that failed, such as an import that created nothing.

    Args:
        workspace_id (str):
        action (ActivityAction | Unset):
        outcome (ActivityOutcome | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.
        subject_type (ActivitySubjectType | Unset):
        subject_id (UUID | Unset):
        actor_user_id (UUID | Unset):
        actor_api_key_id (UUID | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ActivityPageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        action=action,
        outcome=outcome,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
        subject_type=subject_type,
        subject_id=subject_id,
        actor_user_id=actor_user_id,
        actor_api_key_id=actor_api_key_id,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    action: ActivityAction | Unset = UNSET,
    outcome: ActivityOutcome | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
    subject_type: ActivitySubjectType | Unset = UNSET,
    subject_id: UUID | Unset = UNSET,
    actor_user_id: UUID | Unset = UNSET,
    actor_api_key_id: UUID | Unset = UNSET,
) -> Response[ActivityPageDto]:
    """Who changed what in the workspace, newest first

     Includes operations that failed, such as an import that created nothing.

    Args:
        workspace_id (str):
        action (ActivityAction | Unset):
        outcome (ActivityOutcome | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.
        subject_type (ActivitySubjectType | Unset):
        subject_id (UUID | Unset):
        actor_user_id (UUID | Unset):
        actor_api_key_id (UUID | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ActivityPageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        action=action,
        outcome=outcome,
        direction=direction,
        cursor=cursor,
        page=page,
        limit=limit,
        subject_type=subject_type,
        subject_id=subject_id,
        actor_user_id=actor_user_id,
        actor_api_key_id=actor_api_key_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    action: ActivityAction | Unset = UNSET,
    outcome: ActivityOutcome | Unset = UNSET,
    direction: SortDirection | Unset = SortDirection.DESC,
    cursor: UUID | Unset = UNSET,
    page: float | Unset = UNSET,
    limit: float | Unset = 25.0,
    subject_type: ActivitySubjectType | Unset = UNSET,
    subject_id: UUID | Unset = UNSET,
    actor_user_id: UUID | Unset = UNSET,
    actor_api_key_id: UUID | Unset = UNSET,
) -> ActivityPageDto | None:
    """Who changed what in the workspace, newest first

     Includes operations that failed, such as an import that created nothing.

    Args:
        workspace_id (str):
        action (ActivityAction | Unset):
        outcome (ActivityOutcome | Unset):
        direction (SortDirection | Unset):  Default: SortDirection.DESC.
        cursor (UUID | Unset):
        page (float | Unset):
        limit (float | Unset):  Default: 25.0.
        subject_type (ActivitySubjectType | Unset):
        subject_id (UUID | Unset):
        actor_user_id (UUID | Unset):
        actor_api_key_id (UUID | Unset):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ActivityPageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            action=action,
            outcome=outcome,
            direction=direction,
            cursor=cursor,
            page=page,
            limit=limit,
            subject_type=subject_type,
            subject_id=subject_id,
            actor_user_id=actor_user_id,
            actor_api_key_id=actor_api_key_id,
        )
    ).parsed
