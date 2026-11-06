<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SuggestionKind;
use Crossmart\Enum\SuggestionStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SuggestionDto implements JsonSerializable
{
    /**
     * @param SuggestionConnectionDto|null $connection The store the change is for; null for the product’s own content
     * @param string $currentValue The value it replaces, as it was when it was made
     * @param string $rationale Why the agent proposes it
     */
    public function __construct(
        public readonly string $id,
        public readonly string $productId,
        public readonly string $productTitle,
        public readonly ?string $imageUrl,
        public readonly ?SuggestionConnectionDto $connection,
        public readonly SuggestionKind|string $kind,
        public readonly SuggestionStatus|string $status,
        public readonly string $currentValue,
        public readonly string $proposedValue,
        public readonly string $rationale,
        public readonly SuggestionCreatorDto $createdBy,
        public readonly ?SuggestionReviewDto $review,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $updatedAt,
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
            id: $payload->string('id'),
            productId: $payload->string('productId'),
            productTitle: $payload->string('productTitle'),
            imageUrl: $payload->isNull('imageUrl') ? null : $payload->string('imageUrl'),
            connection: $payload->isNull('connection') ? null : $payload->model('connection', SuggestionConnectionDto::fromArray(...)),
            kind: $payload->enum('kind', SuggestionKind::class),
            status: $payload->enum('status', SuggestionStatus::class),
            currentValue: $payload->string('currentValue'),
            proposedValue: $payload->string('proposedValue'),
            rationale: $payload->string('rationale'),
            createdBy: $payload->model('createdBy', SuggestionCreatorDto::fromArray(...)),
            review: $payload->isNull('review') ? null : $payload->model('review', SuggestionReviewDto::fromArray(...)),
            createdAt: $payload->dateTime('createdAt'),
            updatedAt: $payload->dateTime('updatedAt'),
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
            'id' => $this->id,
            'productId' => $this->productId,
            'productTitle' => $this->productTitle,
            'imageUrl' => $this->imageUrl,
            'connection' => $this->connection?->toArray(),
            'kind' => Payload::enumValue($this->kind),
            'status' => Payload::enumValue($this->status),
            'currentValue' => $this->currentValue,
            'proposedValue' => $this->proposedValue,
            'rationale' => $this->rationale,
            'createdBy' => $this->createdBy->toArray(),
            'review' => $this->review?->toArray(),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
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
