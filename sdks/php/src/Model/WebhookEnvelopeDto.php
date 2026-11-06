<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookEventType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class WebhookEnvelopeDto implements JsonSerializable
{
    /**
     * @param string $id The event id: deduplicate on it
     * @param string $createdAt When the change happened
     * @param array<string, mixed> $data The event’s data; its shape depends on the type
     */
    public function __construct(
        public readonly string $id,
        public readonly WebhookEventType|string $type,
        public readonly string $createdAt,
        public readonly string $workspaceId,
        public readonly string $apiVersion,
        public readonly array $data,
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
            type: $payload->enum('type', WebhookEventType::class),
            createdAt: $payload->string('createdAt'),
            workspaceId: $payload->string('workspaceId'),
            apiVersion: $payload->string('apiVersion'),
            data: $payload->object('data'),
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
            'type' => Payload::enumValue($this->type),
            'createdAt' => $this->createdAt,
            'workspaceId' => $this->workspaceId,
            'apiVersion' => $this->apiVersion,
            'data' => $this->data,
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
