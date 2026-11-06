<?php

declare(strict_types=1);

namespace Crossmart\Resource;

use Crossmart\Config\Defaults;
use Crossmart\Model\BulkApproveSuggestionsDto;
use Crossmart\Model\BulkReviewResultDto;
use Crossmart\Model\SuggestionDto;
use Crossmart\Pagination\Page;
use Crossmart\Pagination\Paginator;
use Crossmart\Resource\Filter\SuggestionFilters;
use Generator;

/**
 * Review the changes AI agents propose. Nothing changes until a suggestion is approved.
 *
 * Approving applies the change the way an edit would (a store override, synced to the store) and
 * returns the suggestion `Applied`, or `Stale` when its field changed since it was made.
 * Reviewing a suggestion that is no longer pending throws a
 * {@see \Crossmart\Exception\ConflictException}.
 */
final class Suggestions extends AbstractResource
{
    /**
     * One page of suggestions, newest first.
     *
     * @return Page<SuggestionDto>
     */
    public function list(?SuggestionFilters $filters = null, ?string $cursor = null, ?int $limit = null): Page
    {
        $filters ??= new SuggestionFilters();
        $page = $this->api->suggestions->suggestionsControllerListV1(
            workspaceId: $this->workspaceId(),
            status: $filters->status,
            productId: $filters->productId,
            connectionId: $filters->connectionId,
            kind: $filters->kind,
            cursor: $cursor,
            limit: $limit,
        );

        return Page::of($page->items, $page->nextCursor, $page->total);
    }

    /**
     * Every matching suggestion, fetched page by page as you iterate.
     *
     * @return Generator<int, SuggestionDto>
     */
    public function listAll(?SuggestionFilters $filters = null, int $pageSize = Defaults::MAX_PAGE_SIZE): Generator
    {
        return Paginator::items(fn (?string $cursor): Page => $this->list($filters, $cursor, $pageSize));
    }

    public function get(string $suggestionId): SuggestionDto
    {
        return $this->api->suggestions->suggestionsControllerGetV1($this->workspaceId(), $suggestionId);
    }

    /**
     * Applies a pending suggestion.
     */
    public function approve(string $suggestionId): SuggestionDto
    {
        return $this->api->suggestions->suggestionsControllerApproveV1($this->workspaceId(), $suggestionId);
    }

    /**
     * Rejects a pending suggestion. Nothing is changed.
     */
    public function reject(string $suggestionId): SuggestionDto
    {
        return $this->api->suggestions->suggestionsControllerRejectV1($this->workspaceId(), $suggestionId);
    }

    /**
     * Applies several pending suggestions. Those no longer pending are skipped.
     *
     * @param list<string> $suggestionIds
     */
    public function approveMany(array $suggestionIds): BulkReviewResultDto
    {
        return $this->api->suggestions->suggestionsControllerBulkApproveV1($this->workspaceId(), new BulkApproveSuggestionsDto($suggestionIds));
    }
}
