<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AttentionSummaryDto implements JsonSerializable
{
    /**
     * @param int|float $total The sum of the visible sections’ counts, for one badge
     */
    public function __construct(
        public readonly int|float $total,
        public readonly ?AttentionStoresDto $stores,
        public readonly ?AttentionListingsDto $listings,
        public readonly ?AttentionProposalsDto $proposals,
        public readonly ?AttentionSuggestionsDto $suggestions,
    ) {
    }

    /**
     * Builds the model from the API's JSON shape.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $payload = new Payload($data, self::class);

        return new self(
            total: $payload->number('total'),
            stores: $payload->isNull('stores') ? null : $payload->model('stores', AttentionStoresDto::fromArray(...)),
            listings: $payload->isNull('listings') ? null : $payload->model('listings', AttentionListingsDto::fromArray(...)),
            proposals: $payload->isNull('proposals') ? null : $payload->model('proposals', AttentionProposalsDto::fromArray(...)),
            suggestions: $payload->isNull('suggestions') ? null : $payload->model('suggestions', AttentionSuggestionsDto::fromArray(...)),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'total' => $this->total,
            'stores' => $this->stores?->toArray(),
            'listings' => $this->listings?->toArray(),
            'proposals' => $this->proposals?->toArray(),
            'suggestions' => $this->suggestions?->toArray(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
