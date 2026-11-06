<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Model\AiStatusDto;
use Crossmart\Model\AiUsageReportDto;
use Crossmart\Model\ContentDraftDto;
use Crossmart\Model\ContentGenerationReceiptDto;
use Crossmart\Model\CreateContentDraftDto;
use Crossmart\Model\GenerateContentDto;
use DateTimeImmutable;

/**
 * Ask Crossmart's AI agents to write. Calls are metered against the plan's AI credits.
 *
 * Generated content never changes a product directly: it arrives as pending suggestions that a
 * person (or an approver key) reviews with {@see Suggestions}. Both writing calls throw a
 * {@see \Crossmart\Exception\ServerException} (503) while the server has no AI provider.
 */
final class Ai extends AbstractResource
{
    /**
     * Whether AI features are available on this server, and which provider and model.
     */
    public function status(): AiStatusDto
    {
        return $this->api->ai->aiControllerStatusV1($this->workspaceId());
    }

    /**
     * AI calls and tokens the workspace used, per feature and model. The period defaults to the
     * current UTC month.
     */
    public function usage(?DateTimeImmutable $from = null, ?DateTimeImmutable $to = null): AiUsageReportDto
    {
        return $this->api->ai->aiControllerUsageReportV1($this->workspaceId(), $from, $to);
    }

    /**
     * Queues the Content Generator for each product. It writes a title and description fitted to
     * the store's channel. The results arrive as pending suggestions.
     *
     * @param list<string> $productIds
     */
    public function generateContent(string $storeId, array $productIds): ContentGenerationReceiptDto
    {
        $body = new GenerateContentDto(connectionId: $storeId, productIds: $productIds);

        return $this->api->ai->aiControllerGenerateContentV1($this->workspaceId(), $body);
    }

    /**
     * Rewrites a product's title or description right away, for the catalog or one store.
     * Nothing is stored: the answer is a draft to show in an editor.
     *
     * @param CreateContentDraftDto|array<string, mixed> $request
     */
    public function draftContent(CreateContentDraftDto|array $request): ContentDraftDto
    {
        $body = is_array($request) ? CreateContentDraftDto::fromArray($request) : $request;

        return $this->api->ai->aiControllerDraftContentV1($this->workspaceId(), $body);
    }
}
