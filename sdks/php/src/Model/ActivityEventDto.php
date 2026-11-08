<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ActivityAction;
use Crossmart\Enum\ActivityOutcome;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ActivityEventDto implements JsonSerializable
{
    /**
     * @param int|float|null $itemCount Items the action covered, such as products changed in bulk
     * @param string|null $failureReason Why a failed action failed
     * @param string|null $connectionId The store (channel connection) it happened on, such as where a listing failed
     */
    public function __construct(
        public readonly string $id,
        public readonly ActivityAction|string $action,
        public readonly ActivityOutcome|string $outcome,
        public readonly string $summary,
        public readonly ActivityActorDto $actor,
        public readonly ?ActivitySubjectDto $subject,
        public readonly int|float|null $itemCount,
        public readonly ?string $failureReason,
        public readonly ?string $connectionId,
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
            action: $payload->enum('action', ActivityAction::class),
            outcome: $payload->enum('outcome', ActivityOutcome::class),
            summary: $payload->string('summary'),
            actor: $payload->model('actor', ActivityActorDto::fromArray(...)),
            subject: $payload->isNull('subject') ? null : $payload->model('subject', ActivitySubjectDto::fromArray(...)),
            itemCount: $payload->isNull('itemCount') ? null : $payload->number('itemCount'),
            failureReason: $payload->isNull('failureReason') ? null : $payload->string('failureReason'),
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
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
            'action' => Payload::enumValue($this->action),
            'outcome' => Payload::enumValue($this->outcome),
            'summary' => $this->summary,
            'actor' => $this->actor->toArray(),
            'subject' => $this->subject?->toArray(),
            'itemCount' => $this->itemCount,
            'failureReason' => $this->failureReason,
            'connectionId' => $this->connectionId,
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
