<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AgentWorkerCancelResultDto;
use Crossmart\Model\AgentWorkerConversationDetailDto;
use Crossmart\Model\AgentWorkerConversationDto;
use Crossmart\Model\AgentWorkerConversationPageDto;
use Crossmart\Model\CreateAgentWorkerConversationDto;
use Crossmart\Model\DecideAgentWorkerActionsDto;
use Crossmart\Model\SendAgentWorkerMessageDto;

/**
 * The operations tagged "Agent Worker".
 */
final class AgentWorkerApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Your Agent Worker conversations, most recently active first
     *
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerListV1(
        string $workspaceId,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): AgentWorkerConversationPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['page' => $page, 'limit' => $limit],
        ));

        return AgentWorkerConversationPageDto::fromArray($response->object());
    }

    /**
     * Start a conversation with Agent Worker
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerCreateV1(
        string $workspaceId,
        CreateAgentWorkerConversationDto $body,
    ): AgentWorkerConversationDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return AgentWorkerConversationDto::fromArray($response->object());
    }

    /**
     * A conversation with its messages, tool calls and proposed changes
     *
     * Answers 404 for an unknown id and for anyone else’s conversation.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerGetV1(
        string $workspaceId,
        string $conversationId,
    ): AgentWorkerConversationDetailDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations/{conversationId}',
            pathParameters: ['workspaceId' => $workspaceId, 'conversationId' => $conversationId],
        ));

        return AgentWorkerConversationDetailDto::fromArray($response->object());
    }

    /**
     * Delete a conversation, with its messages and proposed changes
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerDeleteV1(
        string $workspaceId,
        string $conversationId,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Delete,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations/{conversationId}',
            pathParameters: ['workspaceId' => $workspaceId, 'conversationId' => $conversationId],
        ));
    }

    /**
     * Send a message and stream Agent Worker’s turn
     *
     * Agent Worker reads what it needs right away and proposes changes, which wait for `POST …/decision`. Changes still waiting are dropped (expired) by a new message. Each model call uses one AI credit: answers 402 when the plan has none left (while plans are enforced), 403 in an unclaimed sandbox, 409 while a turn runs, 429 past the rate limit, and 503 while AI is not configured. A read-only subscription still allows reading; Agent Worker then proposes no changes.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerSendMessageV1(
        string $workspaceId,
        string $conversationId,
        SendAgentWorkerMessageDto $body,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations/{conversationId}/messages',
            pathParameters: ['workspaceId' => $workspaceId, 'conversationId' => $conversationId],
            body: $body->toArray(),
        ));
    }

    /**
     * Approve or reject the changes waiting in a conversation, and stream the result
     *
     * Approves the listed actions and rejects every other waiting one, in one step. Approved changes are made through the API as "Agent Worker on behalf of" you, then Agent Worker goes on with their results. Actions with `risks` (deletions, price changes, bulk changes) also need `confirmHighRisk`: 400 without it. 409 when nothing waits or a turn runs.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerDecideV1(
        string $workspaceId,
        string $conversationId,
        DecideAgentWorkerActionsDto $body,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations/{conversationId}/decision',
            pathParameters: ['workspaceId' => $workspaceId, 'conversationId' => $conversationId],
            body: $body->toArray(),
        ));
    }

    /**
     * Stop the running turn
     *
     * The model call is aborted; what already ran stays, and nothing more runs.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function agentWorkerControllerCancelV1(
        string $workspaceId,
        string $conversationId,
    ): AgentWorkerCancelResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/agent-worker/conversations/{conversationId}/cancel',
            pathParameters: ['workspaceId' => $workspaceId, 'conversationId' => $conversationId],
        ));

        return AgentWorkerCancelResultDto::fromArray($response->object());
    }
}
