<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentWorkerConversationDto implements JsonSerializable
{
    /**
     * @param int|float $pendingActionCount Changes waiting for approval
     */
    public function __construct(
        public readonly string $id,
        public readonly string $title,
        public readonly int|float $pendingActionCount,
        public readonly DateTimeImmutable $lastActivityAt,
        public readonly DateTimeImmutable $createdAt,
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
            title: $payload->string('title'),
            pendingActionCount: $payload->number('pendingActionCount'),
            lastActivityAt: $payload->dateTime('lastActivityAt'),
            createdAt: $payload->dateTime('createdAt'),
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
            'title' => $this->title,
            'pendingActionCount' => $this->pendingActionCount,
            'lastActivityAt' => Payload::formatDateTime($this->lastActivityAt),
            'createdAt' => Payload::formatDateTime($this->createdAt),
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
