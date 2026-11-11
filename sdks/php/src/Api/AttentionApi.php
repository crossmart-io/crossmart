<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AttentionSummaryDto;

/**
 * The operations tagged "Attention".
 */
final class AttentionApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * What needs the merchant now
     *
     * Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions waiting for review: a count and the latest few of each, for Home and a sidebar badge. Counts match the Channels, Agent proposals and Suggestions pages. A section is null without the permission its page needs (`channels:view` or `suggestions:view`).
     *
     * @param int|float|null $limit Items each section lists, latest first. The counts always cover everything.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function attentionControllerGetV1(
        string $workspaceId,
        int|float|null $limit = null,
    ): AttentionSummaryDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/attention',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['limit' => $limit],
        ));

        return AttentionSummaryDto::fromArray($response->object());
    }
}
