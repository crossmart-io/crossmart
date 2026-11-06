<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookEventType;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class CreateWebhookEndpointDto implements JsonSerializable
{
    /**
     * @param string $url Where events are POSTed. https and a public address; plain http only outside production.
     * @param list<WebhookEventType|string> $eventTypes The events to receive. `webhook.test` cannot be subscribed to.
     */
    public function __construct(
        public readonly string $url,
        public readonly array $eventTypes,
        public readonly string|Undefined|null $description = Undefined::Value,
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
            url: $payload->string('url'),
            eventTypes: $payload->enumList('eventTypes', WebhookEventType::class),
            description: !$payload->has('description') ? Undefined::Value : ($payload->isNull('description') ? null : $payload->string('description')),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'url' => $this->url,
            'eventTypes' => array_map(Payload::enumValue(...), $this->eventTypes),
        ];
        if (!$this->description instanceof Undefined) {
            $data['description'] = $this->description;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
