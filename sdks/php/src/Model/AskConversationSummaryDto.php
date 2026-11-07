<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AskCallerType;
use Crossmart\Enum\AskChannel;
use Crossmart\Enum\AskOutcome;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AskConversationSummaryDto implements JsonSerializable
{
    /**
     * @param string|null $clientName The agent’s name, for agents
     * @param string|null $firstQuestion The first question, redacted
     */
    public function __construct(
        public readonly string $id,
        public readonly AskChannel|string $channel,
        public readonly AskCallerType|string $callerType,
        public readonly ?string $clientName,
        public readonly ?string $workspaceId,
        public readonly int|float $turnCount,
        public readonly ?string $firstQuestion,
        public readonly AskOutcome|string|null $lastOutcome,
        public readonly bool $escalated,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $lastActivityAt,
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
            channel: $payload->enum('channel', AskChannel::class),
            callerType: $payload->enum('callerType', AskCallerType::class),
            clientName: $payload->isNull('clientName') ? null : $payload->string('clientName'),
            workspaceId: $payload->isNull('workspaceId') ? null : $payload->string('workspaceId'),
            turnCount: $payload->number('turnCount'),
            firstQuestion: $payload->isNull('firstQuestion') ? null : $payload->string('firstQuestion'),
            lastOutcome: $payload->isNull('lastOutcome') ? null : $payload->enum('lastOutcome', AskOutcome::class),
            escalated: $payload->bool('escalated'),
            createdAt: $payload->dateTime('createdAt'),
            lastActivityAt: $payload->dateTime('lastActivityAt'),
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
            'channel' => Payload::enumValue($this->channel),
            'callerType' => Payload::enumValue($this->callerType),
            'clientName' => $this->clientName,
            'workspaceId' => $this->workspaceId,
            'turnCount' => $this->turnCount,
            'firstQuestion' => $this->firstQuestion,
            'lastOutcome' => Payload::enumValue($this->lastOutcome),
            'escalated' => $this->escalated,
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'lastActivityAt' => Payload::formatDateTime($this->lastActivityAt),
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
