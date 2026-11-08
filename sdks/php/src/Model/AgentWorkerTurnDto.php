<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerTurnStatus;
use Crossmart\Enum\AgentWorkerTurnTrigger;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentWorkerTurnDto implements JsonSerializable
{
    /**
     * @param int|float $modelCalls Model calls so far; each uses one AI credit
     * @param string|null $failureReason Why it failed or stopped early
     */
    public function __construct(
        public readonly string $id,
        public readonly AgentWorkerTurnTrigger|string $trigger,
        public readonly AgentWorkerTurnStatus|string $status,
        public readonly int|float $modelCalls,
        public readonly int|float $inputTokens,
        public readonly int|float $outputTokens,
        public readonly ?string $failureReason,
        public readonly DateTimeImmutable $startedAt,
        public readonly ?DateTimeImmutable $finishedAt,
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
            trigger: $payload->enum('trigger', AgentWorkerTurnTrigger::class),
            status: $payload->enum('status', AgentWorkerTurnStatus::class),
            modelCalls: $payload->number('modelCalls'),
            inputTokens: $payload->number('inputTokens'),
            outputTokens: $payload->number('outputTokens'),
            failureReason: $payload->isNull('failureReason') ? null : $payload->string('failureReason'),
            startedAt: $payload->dateTime('startedAt'),
            finishedAt: $payload->isNull('finishedAt') ? null : $payload->dateTime('finishedAt'),
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
            'trigger' => Payload::enumValue($this->trigger),
            'status' => Payload::enumValue($this->status),
            'modelCalls' => $this->modelCalls,
            'inputTokens' => $this->inputTokens,
            'outputTokens' => $this->outputTokens,
            'failureReason' => $this->failureReason,
            'startedAt' => Payload::formatDateTime($this->startedAt),
            'finishedAt' => $this->finishedAt === null ? null : Payload::formatDateTime($this->finishedAt),
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
