<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\SuggestionKind;
use Crossmart\Enum\SuggestionStatus;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\BulkApproveSuggestionsDto;
use Crossmart\Model\BulkReviewResultDto;
use Crossmart\Model\SuggestionDto;
use Crossmart\Model\SuggestionPageDto;

/**
 * The operations tagged "Suggestions".
 */
final class SuggestionsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Suggestions, newest first
     *
     * Filter by `PENDING` for the inbox.
     *
     * @param SuggestionStatus|string|null $status `PENDING` is the inbox
     * @param string|null $productId Suggestions for one product
     * @param string|null $connectionId Suggestions for one store
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function suggestionsControllerListV1(
        string $workspaceId,
        SuggestionStatus|string|null $status = null,
        ?string $productId = null,
        ?string $connectionId = null,
        SuggestionKind|string|null $kind = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): SuggestionPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/suggestions',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['status' => $status, 'productId' => $productId, 'connectionId' => $connectionId, 'kind' => $kind, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return SuggestionPageDto::fromArray($response->object());
    }

    /**
     * Approve several suggestions
     *
     * Applies each pending suggestion, or marks it `STALE` when its field changed since it was made. Suggestions that are not pending are skipped.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function suggestionsControllerBulkApproveV1(
        string $workspaceId,
        BulkApproveSuggestionsDto $body,
    ): BulkReviewResultDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/suggestions/bulk-approve',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return BulkReviewResultDto::fromArray($response->object());
    }

    /**
     * One suggestion
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function suggestionsControllerGetV1(
        string $workspaceId,
        string $suggestionId,
    ): SuggestionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}',
            pathParameters: ['workspaceId' => $workspaceId, 'suggestionId' => $suggestionId],
        ));

        return SuggestionDto::fromArray($response->object());
    }

    /**
     * Approve a suggestion
     *
     * Applies the change the way an edit would (a channel override, synced to the store), and returns it `APPLIED`. When its field changed since it was made, nothing is applied and it returns `STALE`. A suggestion that is no longer pending answers 409.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function suggestionsControllerApproveV1(
        string $workspaceId,
        string $suggestionId,
    ): SuggestionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}/approve',
            pathParameters: ['workspaceId' => $workspaceId, 'suggestionId' => $suggestionId],
        ));

        return SuggestionDto::fromArray($response->object());
    }

    /**
     * Reject a suggestion
     *
     * Nothing is changed. A suggestion that is no longer pending answers 409.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function suggestionsControllerRejectV1(
        string $workspaceId,
        string $suggestionId,
    ): SuggestionDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}/reject',
            pathParameters: ['workspaceId' => $workspaceId, 'suggestionId' => $suggestionId],
        ));

        return SuggestionDto::fromArray($response->object());
    }
}
