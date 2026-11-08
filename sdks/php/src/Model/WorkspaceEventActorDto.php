<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ActivityActorType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class WorkspaceEventActorDto implements JsonSerializable
{
    /**
     * @param string|null $name The person or API key; for an agent, the person it acted for
     * @param string|null $agentName The agent, for agent actions: "Crossmart Agent", or a connected agent such as "Claude"
     * @param string|null $approvedByName Who approved the outside agent's proposal that made the change, if anyone
     */
    public function __construct(
        public readonly ActivityActorType|string $type,
        public readonly ?string $name,
        public readonly ?string $agentName,
        public readonly ?string $approvedByName,
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
            type: $payload->enum('type', ActivityActorType::class),
            name: $payload->isNull('name') ? null : $payload->string('name'),
            agentName: $payload->isNull('agentName') ? null : $payload->string('agentName'),
            approvedByName: $payload->isNull('approvedByName') ? null : $payload->string('approvedByName'),
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
            'type' => Payload::enumValue($this->type),
            'name' => $this->name,
            'agentName' => $this->agentName,
            'approvedByName' => $this->approvedByName,
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
