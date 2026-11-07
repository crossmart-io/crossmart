<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AskAnswerDto;
use Crossmart\Model\AskEscalationDto;
use Crossmart\Model\AskQuestionDto;
use Crossmart\Model\CreateAskEscalationDto;
use Crossmart\Model\OpenedAskEscalationDto;

/**
 * The operations tagged "Ask Crossmart".
 */
final class AskCrossmartApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Ask a question about Crossmart
     *
     * Answers from Crossmart’s public documentation and plan lineup, citing the pages it used. When they do not answer the question, `outcome` is `unknown` and the answer points to the support address. Send the returned `conversationId` with a follow-up question to continue the conversation. With an API key, an agent token, or a session and a `workspaceId`, it can also look up that workspace (listings, plan and usage, stores) to answer, read-only and within the caller’s permissions; it never changes anything. When a person can help, `escalation.offered` is true (see `POST /api/v1/ask/escalations`). Questions and answers are stored, with secrets redacted, for 180 days. No credentials are needed: anonymous callers may ask 5 questions a minute and 50 a day per IP address; with an API key, session or agent token, 20 a minute and 500 a day. Answers 429 past those, and 503 when AI is not configured or the platform’s daily question budget is spent.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askControllerAskV1(
        AskQuestionDto $body,
    ): AskAnswerDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/ask',
            body: $body->toArray(),
        ));

        return AskAnswerDto::fromArray($response->object());
    }

    /**
     * Ask for a person
     *
     * Hands your conversation with Ask Crossmart to the Crossmart team, who get it by email. Their reply goes to `contactEmail`, is POSTed to `callbackUrl` (signed like webhooks, with the `callbackSecret` returned here), and can be read with `GET /api/v1/ask/escalations/{id}`. Only the caller who had the conversation can escalate it, 5 times a day at most.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askEscalationsControllerOpenV1(
        CreateAskEscalationDto $body,
    ): OpenedAskEscalationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/ask/escalations',
            body: $body->toArray(),
        ));

        return OpenedAskEscalationDto::fromArray($response->object());
    }

    /**
     * Read an escalation
     *
     * Its status and, once the team answered, the reply. The ticket id returned when the escalation was opened is the only credential needed.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askEscalationsControllerGetV1(
        string $escalationId,
    ): AskEscalationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/ask/escalations/{escalationId}',
            pathParameters: ['escalationId' => $escalationId],
        ));

        return AskEscalationDto::fromArray($response->object());
    }
}
