<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\WebhookEventType;
use Crossmart\Serialization\Payload;
use Crossmart\Serialization\Undefined;
use JsonSerializable;

final class UpdateWebhookEndpointDto implements JsonSerializable
{
    /**
     * @param string|null $url Where events are POSTed. https and a public address; plain http only outside production.
     * @param list<WebhookEventType|string>|null $eventTypes The events to receive. `webhook.test` cannot be subscribed to.
     * @param bool|null $enabled false turns the endpoint off; true turns it back on and clears its failures
     */
    public function __construct(
        public readonly ?string $url = null,
        public readonly string|Undefined|null $description = Undefined::Value,
        public readonly ?array $eventTypes = null,
        public readonly ?bool $enabled = null,
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
            url: $payload->isNull('url') ? null : $payload->string('url'),
            description: !$payload->has('description') ? Undefined::Value : ($payload->isNull('description') ? null : $payload->string('description')),
            eventTypes: $payload->isNull('eventTypes') ? null : $payload->enumList('eventTypes', WebhookEventType::class),
            enabled: $payload->isNull('enabled') ? null : $payload->bool('enabled'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->url !== null) {
            $data['url'] = $this->url;
        }
        if (!$this->description instanceof Undefined) {
            $data['description'] = $this->description;
        }
        if ($this->eventTypes !== null) {
            $data['eventTypes'] = array_map(Payload::enumValue(...), $this->eventTypes);
        }
        if ($this->enabled !== null) {
            $data['enabled'] = $this->enabled;
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
