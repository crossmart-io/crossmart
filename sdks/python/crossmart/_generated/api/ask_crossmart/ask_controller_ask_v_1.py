from http import HTTPStatus
from typing import Any, cast

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.ask_answer_dto import AskAnswerDto
from ...models.ask_question_dto import AskQuestionDto
from ...types import Response


def _get_kwargs(
    *,
    body: AskQuestionDto,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/ask",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Any | AskAnswerDto | None:
    if response.status_code == 200:
        response_200 = AskAnswerDto.from_dict(response.json())

        return response_200

    if response.status_code == 404:
        response_404 = cast(Any, None)
        return response_404

    if response.status_code == 429:
        response_429 = cast(Any, None)
        return response_429

    if response.status_code == 503:
        response_503 = cast(Any, None)
        return response_503

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[Any | AskAnswerDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient,
    body: AskQuestionDto,
) -> Response[Any | AskAnswerDto]:
    """Ask a question about Crossmart

     Answers from Crossmart’s public documentation and plan lineup, citing the pages it used. When they
    do not answer the question, `outcome` is `unknown` and the answer points to the support address.
    Send the returned `conversationId` with a follow-up question to continue the conversation. With an
    API key, an agent token, or a session and a `workspaceId`, it can also look up that workspace
    (listings, plan and usage, stores) to answer, read-only and within the caller’s permissions; it
    never changes anything. When a person can help, `escalation.offered` is true (see `POST
    /api/v1/ask/escalations`). Questions and answers are stored, with secrets redacted, for 180 days. No
    credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address;
    with an API key, session or agent token, 20 a minute and 500 a day. Answers 429 past those, and 503
    when AI is not configured or the platform’s daily question budget is spent.

    Args:
        body (AskQuestionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskAnswerDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient,
    body: AskQuestionDto,
) -> Any | AskAnswerDto | None:
    """Ask a question about Crossmart

     Answers from Crossmart’s public documentation and plan lineup, citing the pages it used. When they
    do not answer the question, `outcome` is `unknown` and the answer points to the support address.
    Send the returned `conversationId` with a follow-up question to continue the conversation. With an
    API key, an agent token, or a session and a `workspaceId`, it can also look up that workspace
    (listings, plan and usage, stores) to answer, read-only and within the caller’s permissions; it
    never changes anything. When a person can help, `escalation.offered` is true (see `POST
    /api/v1/ask/escalations`). Questions and answers are stored, with secrets redacted, for 180 days. No
    credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address;
    with an API key, session or agent token, 20 a minute and 500 a day. Answers 429 past those, and 503
    when AI is not configured or the platform’s daily question budget is spent.

    Args:
        body (AskQuestionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskAnswerDto
    """

    return sync_detailed(
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient,
    body: AskQuestionDto,
) -> Response[Any | AskAnswerDto]:
    """Ask a question about Crossmart

     Answers from Crossmart’s public documentation and plan lineup, citing the pages it used. When they
    do not answer the question, `outcome` is `unknown` and the answer points to the support address.
    Send the returned `conversationId` with a follow-up question to continue the conversation. With an
    API key, an agent token, or a session and a `workspaceId`, it can also look up that workspace
    (listings, plan and usage, stores) to answer, read-only and within the caller’s permissions; it
    never changes anything. When a person can help, `escalation.offered` is true (see `POST
    /api/v1/ask/escalations`). Questions and answers are stored, with secrets redacted, for 180 days. No
    credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address;
    with an API key, session or agent token, 20 a minute and 500 a day. Answers 429 past those, and 503
    when AI is not configured or the platform’s daily question budget is spent.

    Args:
        body (AskQuestionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[Any | AskAnswerDto]
    """

    kwargs = _get_kwargs(
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient,
    body: AskQuestionDto,
) -> Any | AskAnswerDto | None:
    """Ask a question about Crossmart

     Answers from Crossmart’s public documentation and plan lineup, citing the pages it used. When they
    do not answer the question, `outcome` is `unknown` and the answer points to the support address.
    Send the returned `conversationId` with a follow-up question to continue the conversation. With an
    API key, an agent token, or a session and a `workspaceId`, it can also look up that workspace
    (listings, plan and usage, stores) to answer, read-only and within the caller’s permissions; it
    never changes anything. When a person can help, `escalation.offered` is true (see `POST
    /api/v1/ask/escalations`). Questions and answers are stored, with secrets redacted, for 180 days. No
    credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address;
    with an API key, session or agent token, 20 a minute and 500 a day. Answers 429 past those, and 503
    when AI is not configured or the platform’s daily question budget is spent.

    Args:
        body (AskQuestionDto):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Any | AskAnswerDto
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
        )
    ).parsed
