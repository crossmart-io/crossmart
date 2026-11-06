<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\AiStatusDto;
use Crossmart\Model\AiUsageReportDto;
use Crossmart\Model\ContentDraftDto;
use Crossmart\Model\ContentGenerationReceiptDto;
use Crossmart\Model\CreateContentDraftDto;
use Crossmart\Model\GenerateContentDto;
use DateTimeImmutable;

/**
 * The operations tagged "AI".
 */
final class AiApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * Whether AI features are available on this server
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function aiControllerStatusV1(
        string $workspaceId,
    ): AiStatusDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/ai/status',
            pathParameters: ['workspaceId' => $workspaceId],
        ));

        return AiStatusDto::fromArray($response->object());
    }

    /**
     * AI calls and tokens used by the workspace
     *
     * Per feature and model, in a period; the current UTC month by default.
     *
     * @param DateTimeImmutable|null $from Start, included
     * @param DateTimeImmutable|null $to End, excluded
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function aiControllerUsageReportV1(
        string $workspaceId,
        ?DateTimeImmutable $from = null,
        ?DateTimeImmutable $to = null,
    ): AiUsageReportDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/ai/usage',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['from' => $from, 'to' => $to],
        ));

        return AiUsageReportDto::fromArray($response->object());
    }

    /**
     * Generate channel content with AI
     *
     * Queues the Content Generator for each product: it writes a title and description fitted to the store’s channel. The results arrive as pending suggestions to review; nothing changes until one is approved. Each product uses one AI credit: answers 402 when the plan’s credits this month do not cover them (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function aiControllerGenerateContentV1(
        string $workspaceId,
        GenerateContentDto $body,
    ): ContentGenerationReceiptDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/ai/content-generations',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return ContentGenerationReceiptDto::fromArray($response->object());
    }

    /**
     * Rewrite a product’s title or description with AI, right away
     *
     * Rewrites the fields asked for, for the catalog or for one store, optionally following an instruction. The answer is a draft for the editor: nothing is stored until the merchant saves it. Uses one AI credit: answers 402 when the plan has none left this month (while plans are enforced), 429 past the rate limit, and 503 while AI is not configured.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function aiControllerDraftContentV1(
        string $workspaceId,
        CreateContentDraftDto $body,
    ): ContentDraftDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Post,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/ai/content-drafts',
            pathParameters: ['workspaceId' => $workspaceId],
            body: $body->toArray(),
        ));

        return ContentDraftDto::fromArray($response->object());
    }
}
