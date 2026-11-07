<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AgentWorkerActionPreviewDto implements JsonSerializable
{
    /**
     * @param string $headline The change in one sentence
     * @param list<string> $details More lines to read, such as a note
     * @param list<AgentWorkerChangeDto> $changes
     */
    public function __construct(
        public readonly ?string $target,
        public readonly string $headline,
        public readonly array $details,
        public readonly array $changes,
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
            target: $payload->isNull('target') ? null : $payload->string('target'),
            headline: $payload->string('headline'),
            details: $payload->stringList('details'),
            changes: $payload->modelList('changes', AgentWorkerChangeDto::fromArray(...)),
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
            'target' => $this->target,
            'headline' => $this->headline,
            'details' => $this->details,
            'changes' => array_map(static fn (AgentWorkerChangeDto $item): array => $item->toArray(), $this->changes),
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
