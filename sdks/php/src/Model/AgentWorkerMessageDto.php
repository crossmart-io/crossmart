<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerRole;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentWorkerMessageDto implements JsonSerializable
{
    /**
     * @param string $text Plain text; the agent may use simple Markdown lists
     * @param list<AgentWorkerActionDto> $actions Tool calls of this answer
     */
    public function __construct(
        public readonly string $id,
        public readonly string $turnId,
        public readonly AgentWorkerRole|string $role,
        public readonly string $text,
        public readonly array $actions,
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
            turnId: $payload->string('turnId'),
            role: $payload->enum('role', AgentWorkerRole::class),
            text: $payload->string('text'),
            actions: $payload->modelList('actions', AgentWorkerActionDto::fromArray(...)),
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
            'turnId' => $this->turnId,
            'role' => Payload::enumValue($this->role),
            'text' => $this->text,
            'actions' => array_map(static fn (AgentWorkerActionDto $item): array => $item->toArray(), $this->actions),
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
