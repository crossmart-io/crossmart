<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class WebhookEndpointWithSecretDto implements JsonSerializable
{
    /**
     * @param string $secret The signing secret. Shown once; store it now.
     */
    public function __construct(
        public readonly WebhookEndpointDto $endpoint,
        public readonly string $secret,
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
            endpoint: $payload->model('endpoint', WebhookEndpointDto::fromArray(...)),
            secret: $payload->string('secret'),
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
            'endpoint' => $this->endpoint->toArray(),
            'secret' => $this->secret,
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
