<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentWorkerActionRisk;
use Crossmart\Enum\AgentWorkerActionStatus;
use Crossmart\Enum\AgentWorkerToolKind;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentWorkerActionDto implements JsonSerializable
{
    /**
     * @param string $toolName The MCP tool it calls
     * @param list<AgentWorkerActionRisk|string> $risks Why approving it also needs `confirmHighRisk`; empty for ordinary changes
     * @param bool $untrustedWarning Text read in the same turn looked like instructions to an AI: review with care
     */
    public function __construct(
        public readonly string $id,
        public readonly string $messageId,
        public readonly string $toolName,
        public readonly string $toolTitle,
        public readonly AgentWorkerToolKind|string $kind,
        public readonly AgentWorkerActionStatus|string $status,
        public readonly string $summary,
        public readonly array $risks,
        public readonly ?AgentWorkerActionPreviewDto $preview,
        public readonly ?string $outcome,
        public readonly bool $isError,
        public readonly bool $untrustedWarning,
        public readonly ?DateTimeImmutable $decidedAt,
        public readonly ?DateTimeImmutable $executedAt,
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
            messageId: $payload->string('messageId'),
            toolName: $payload->string('toolName'),
            toolTitle: $payload->string('toolTitle'),
            kind: $payload->enum('kind', AgentWorkerToolKind::class),
            status: $payload->enum('status', AgentWorkerActionStatus::class),
            summary: $payload->string('summary'),
            risks: $payload->enumList('risks', AgentWorkerActionRisk::class),
            preview: $payload->isNull('preview') ? null : $payload->model('preview', AgentWorkerActionPreviewDto::fromArray(...)),
            outcome: $payload->isNull('outcome') ? null : $payload->string('outcome'),
            isError: $payload->bool('isError'),
            untrustedWarning: $payload->bool('untrustedWarning'),
            decidedAt: $payload->isNull('decidedAt') ? null : $payload->dateTime('decidedAt'),
            executedAt: $payload->isNull('executedAt') ? null : $payload->dateTime('executedAt'),
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
            'messageId' => $this->messageId,
            'toolName' => $this->toolName,
            'toolTitle' => $this->toolTitle,
            'kind' => Payload::enumValue($this->kind),
            'status' => Payload::enumValue($this->status),
            'summary' => $this->summary,
            'risks' => array_map(Payload::enumValue(...), $this->risks),
            'preview' => $this->preview?->toArray(),
            'outcome' => $this->outcome,
            'isError' => $this->isError,
            'untrustedWarning' => $this->untrustedWarning,
            'decidedAt' => $this->decidedAt === null ? null : Payload::formatDateTime($this->decidedAt),
            'executedAt' => $this->executedAt === null ? null : Payload::formatDateTime($this->executedAt),
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
