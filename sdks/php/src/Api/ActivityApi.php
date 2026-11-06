<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Enum\ActivityAction;
use Crossmart\Enum\ActivityOutcome;
use Crossmart\Enum\ActivitySubjectType;
use Crossmart\Enum\SortDirection;
use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\ActivityPageDto;

/**
 * The operations tagged "Activity".
 */
final class ActivityApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Who changed what in the workspace, newest first
     *
     * Includes operations that failed, such as an import that created nothing.
     *
     * @param ActivityOutcome|string|null $outcome `FAILED` lists only what went wrong
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     * @param string|null $subjectId Events about this record, including bulk actions that touched it
     * @param string|null $actorUserId Only what this user did
     * @param string|null $actorApiKeyId Only what this API key did
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function activityControllerListV1(
        string $workspaceId,
        ActivityAction|string|null $action = null,
        ActivityOutcome|string|null $outcome = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
        ActivitySubjectType|string|null $subjectType = null,
        ?string $subjectId = null,
        ?string $actorUserId = null,
        ?string $actorApiKeyId = null,
    ): ActivityPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/activity',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['action' => $action, 'outcome' => $outcome, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit, 'subjectType' => $subjectType, 'subjectId' => $subjectId, 'actorUserId' => $actorUserId, 'actorApiKeyId' => $actorApiKeyId],
        ));

        return ActivityPageDto::fromArray($response->object());
    }

    /**
     * The history of one product, newest first
     *
     * Includes bulk actions that changed it, and its deletion.
     *
     * @param ActivityOutcome|string|null $outcome `FAILED` lists only what went wrong
     * @param string|null $cursor `nextCursor` from the previous page
     * @param int|float|null $page 1-based page number, for tables with page numbers. It wins over `cursor`.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function productActivityControllerListV1(
        string $workspaceId,
        string $productId,
        ActivityAction|string|null $action = null,
        ActivityOutcome|string|null $outcome = null,
        SortDirection|string|null $direction = null,
        ?string $cursor = null,
        int|float|null $page = null,
        int|float|null $limit = null,
    ): ActivityPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/products/{productId}/activity',
            pathParameters: ['workspaceId' => $workspaceId, 'productId' => $productId],
            query: ['action' => $action, 'outcome' => $outcome, 'direction' => $direction, 'cursor' => $cursor, 'page' => $page, 'limit' => $limit],
        ));

        return ActivityPageDto::fromArray($response->object());
    }
}
