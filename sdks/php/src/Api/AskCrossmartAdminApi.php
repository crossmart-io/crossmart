<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\AskChannel;
use Crossmart\Enum\AskEscalationStatus;
use Crossmart\Enum\AskOutcome;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AskConversationDetailDto;
use Crossmart\Model\AskConversationPageDto;
use Crossmart\Model\AskEscalationRecordDto;
use Crossmart\Model\AskQuestionCountDto;
use Crossmart\Model\ReplyAskEscalationDto;
use DateTimeImmutable;

/**
 * The operations tagged "Ask Crossmart admin".
 */
final class AskCrossmartAdminApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Stored conversations, newest first
     *
     * @param DateTimeImmutable|null $from Start, included
     * @param DateTimeImmutable|null $to End, included
     * @param AskOutcome|string|null $outcome Only conversations with at least one answer of this outcome
     * @param bool|null $escalated Only escalated conversations (true) or only others (false)
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerConversationsV1(
        ?DateTimeImmutable $from = null,
        ?DateTimeImmutable $to = null,
        AskOutcome|string|null $outcome = null,
        AskChannel|string|null $channel = null,
        ?bool $escalated = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): AskConversationPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/admin/ask/conversations',
            query: ['from' => $from, 'to' => $to, 'outcome' => $outcome, 'channel' => $channel, 'escalated' => $escalated, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return AskConversationPageDto::fromArray($response->object());
    }

    /**
     * One conversation, with every question, answer and escalation
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerConversationV1(
        string $conversationId,
    ): AskConversationDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/admin/ask/conversations/{conversationId}',
            pathParameters: ['conversationId' => $conversationId],
        ));

        return AskConversationDetailDto::fromArray($response->object());
    }

    /**
     * The questions asked most
     *
     * @param DateTimeImmutable|null $from Start, included
     * @param DateTimeImmutable|null $to End, included
     * @return list<AskQuestionCountDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerTopQuestionsV1(
        ?DateTimeImmutable $from = null,
        ?DateTimeImmutable $to = null,
        int|float|null $limit = null,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/admin/ask/questions/top',
            query: ['from' => $from, 'to' => $to, 'limit' => $limit],
        ));

        return array_map(AskQuestionCountDto::fromArray(...), $response->objectList());
    }

    /**
     * The questions Ask did not answer, or answered unsure, most asked first
     *
     * @param DateTimeImmutable|null $from Start, included
     * @param DateTimeImmutable|null $to End, included
     * @return list<AskQuestionCountDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerUnansweredQuestionsV1(
        ?DateTimeImmutable $from = null,
        ?DateTimeImmutable $to = null,
        int|float|null $limit = null,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/admin/ask/questions/unanswered',
            query: ['from' => $from, 'to' => $to, 'limit' => $limit],
        ));

        return array_map(AskQuestionCountDto::fromArray(...), $response->objectList());
    }

    /**
     * Escalations, newest first
     *
     * @return list<AskEscalationRecordDto>
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerEscalationListV1(
        AskEscalationStatus|string|null $status = null,
        int|float|null $limit = null,
    ): array {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/admin/ask/escalations',
            query: ['status' => $status, 'limit' => $limit],
        ));

        return array_map(AskEscalationRecordDto::fromArray(...), $response->objectList());
    }

    /**
     * Reply to an escalation
     *
     * Stores the reply once, emails it to the contact email, and POSTs it, signed, to the callback URL; the asker can also read it with their ticket id.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function askAdminControllerReplyV1(
        string $escalationId,
        ReplyAskEscalationDto $body,
    ): AskEscalationRecordDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/admin/ask/escalations/{escalationId}/reply',
            pathParameters: ['escalationId' => $escalationId],
            body: $body->toArray(),
        ));

        return AskEscalationRecordDto::fromArray($response->object());
    }
}
