<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AgentProposalStatus;
use Crossmart\Enum\AgentProposerKind;
use Crossmart\Enum\AgentWorkerActionRisk;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AgentProposalDto implements JsonSerializable
{
    /**
     * @param string $toolName The MCP tool it calls
     * @param AgentProposalStatus|string $status A pending proposal past its expiry reads as expired
     * @param string $agentName The agent; for an MCP session with a key, the key's name
     * @param string|null $onBehalfOfName The person the agent acts for
     * @param list<AgentWorkerActionRisk|string> $risks Why approving it also needs `confirmHighRisk`; empty for ordinary changes
     * @param string|null $result The API's answer once applied, or why it was refused
     * @param bool $isError True when the approved change was refused
     * @param DateTimeImmutable $expiresAt When it expires if nobody decides
     */
    public function __construct(
        public readonly string $id,
        public readonly string $toolName,
        public readonly string $toolTitle,
        public readonly AgentProposalStatus|string $status,
        public readonly AgentProposerKind|string $proposerKind,
        public readonly string $agentName,
        public readonly ?string $onBehalfOfName,
        public readonly string $summary,
        public readonly array $risks,
        public readonly ?AgentWorkerActionPreviewDto $preview,
        public readonly AgentWorkerActionTargetsDto $targets,
        public readonly ?string $result,
        public readonly bool $isError,
        public readonly ?string $decidedByName,
        public readonly ?DateTimeImmutable $decidedAt,
        public readonly ?DateTimeImmutable $finishedAt,
        public readonly DateTimeImmutable $expiresAt,
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
            toolName: $payload->string('toolName'),
            toolTitle: $payload->string('toolTitle'),
            status: $payload->enum('status', AgentProposalStatus::class),
            proposerKind: $payload->enum('proposerKind', AgentProposerKind::class),
            agentName: $payload->string('agentName'),
            onBehalfOfName: $payload->isNull('onBehalfOfName') ? null : $payload->string('onBehalfOfName'),
            summary: $payload->string('summary'),
            risks: $payload->enumList('risks', AgentWorkerActionRisk::class),
            preview: $payload->isNull('preview') ? null : $payload->model('preview', AgentWorkerActionPreviewDto::fromArray(...)),
            targets: $payload->model('targets', AgentWorkerActionTargetsDto::fromArray(...)),
            result: $payload->isNull('result') ? null : $payload->string('result'),
            isError: $payload->bool('isError'),
            decidedByName: $payload->isNull('decidedByName') ? null : $payload->string('decidedByName'),
            decidedAt: $payload->isNull('decidedAt') ? null : $payload->dateTime('decidedAt'),
            finishedAt: $payload->isNull('finishedAt') ? null : $payload->dateTime('finishedAt'),
            expiresAt: $payload->dateTime('expiresAt'),
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
            'toolName' => $this->toolName,
            'toolTitle' => $this->toolTitle,
            'status' => Payload::enumValue($this->status),
            'proposerKind' => Payload::enumValue($this->proposerKind),
            'agentName' => $this->agentName,
            'onBehalfOfName' => $this->onBehalfOfName,
            'summary' => $this->summary,
            'risks' => array_map(Payload::enumValue(...), $this->risks),
            'preview' => $this->preview?->toArray(),
            'targets' => $this->targets->toArray(),
            'result' => $this->result,
            'isError' => $this->isError,
            'decidedByName' => $this->decidedByName,
            'decidedAt' => $this->decidedAt === null ? null : Payload::formatDateTime($this->decidedAt),
            'finishedAt' => $this->finishedAt === null ? null : Payload::formatDateTime($this->finishedAt),
            'expiresAt' => Payload::formatDateTime($this->expiresAt),
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
