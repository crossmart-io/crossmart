<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WorkspaceEventCategory;
use Crossmart\Enum\WorkspaceEventSeverity;
use Crossmart\Enum\WorkspaceEventType;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class WorkspaceEventDto implements JsonSerializable
{
    /**
     * @param string $id Stable across reads
     * @param string $cursor Pass as `after` (or `Last-Event-ID`) to read what follows it
     * @param string|null $detail More to read: the store’s error, what a read found, an order’s total
     * @param WorkspaceEventRefsDto $refs What the event is about
     * @param int|float|null $itemCount Items the event covered
     */
    public function __construct(
        public readonly string $id,
        public readonly string $cursor,
        public readonly WorkspaceEventType|string $type,
        public readonly WorkspaceEventCategory|string $category,
        public readonly WorkspaceEventSeverity|string $severity,
        public readonly string $summary,
        public readonly ?string $detail,
        public readonly WorkspaceEventActorDto $actor,
        public readonly WorkspaceEventRefsDto $refs,
        public readonly int|float|null $itemCount,
        public readonly DateTimeImmutable $occurredAt,
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
            cursor: $payload->string('cursor'),
            type: $payload->enum('type', WorkspaceEventType::class),
            category: $payload->enum('category', WorkspaceEventCategory::class),
            severity: $payload->enum('severity', WorkspaceEventSeverity::class),
            summary: $payload->string('summary'),
            detail: $payload->isNull('detail') ? null : $payload->string('detail'),
            actor: $payload->model('actor', WorkspaceEventActorDto::fromArray(...)),
            refs: $payload->model('refs', WorkspaceEventRefsDto::fromArray(...)),
            itemCount: $payload->isNull('itemCount') ? null : $payload->number('itemCount'),
            occurredAt: $payload->dateTime('occurredAt'),
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
            'cursor' => $this->cursor,
            'type' => Payload::enumValue($this->type),
            'category' => Payload::enumValue($this->category),
            'severity' => Payload::enumValue($this->severity),
            'summary' => $this->summary,
            'detail' => $this->detail,
            'actor' => $this->actor->toArray(),
            'refs' => $this->refs->toArray(),
            'itemCount' => $this->itemCount,
            'occurredAt' => Payload::formatDateTime($this->occurredAt),
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
