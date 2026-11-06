<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SuggestionReviewDto implements JsonSerializable
{
    public function __construct(
        public readonly ?string $userId,
        public readonly ?string $apiKeyId,
        public readonly ?string $name,
        public readonly DateTimeImmutable $reviewedAt,
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
            userId: $payload->isNull('userId') ? null : $payload->string('userId'),
            apiKeyId: $payload->isNull('apiKeyId') ? null : $payload->string('apiKeyId'),
            name: $payload->isNull('name') ? null : $payload->string('name'),
            reviewedAt: $payload->dateTime('reviewedAt'),
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
            'userId' => $this->userId,
            'apiKeyId' => $this->apiKeyId,
            'name' => $this->name,
            'reviewedAt' => Payload::formatDateTime($this->reviewedAt),
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
