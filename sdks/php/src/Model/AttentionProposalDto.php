<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AttentionProposalDto implements JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $agentName,
        public readonly string $toolName,
        public readonly string $toolTitle,
        public readonly string $summary,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $expiresAt,
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
            agentName: $payload->string('agentName'),
            toolName: $payload->string('toolName'),
            toolTitle: $payload->string('toolTitle'),
            summary: $payload->string('summary'),
            createdAt: $payload->dateTime('createdAt'),
            expiresAt: $payload->dateTime('expiresAt'),
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
            'agentName' => $this->agentName,
            'toolName' => $this->toolName,
            'toolTitle' => $this->toolTitle,
            'summary' => $this->summary,
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'expiresAt' => Payload::formatDateTime($this->expiresAt),
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
