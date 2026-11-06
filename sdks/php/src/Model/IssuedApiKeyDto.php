<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class IssuedApiKeyDto implements JsonSerializable
{
    /**
     * @param string $secret The full key. Shown once; store it now.
     */
    public function __construct(
        public readonly ApiKeyDto $apiKey,
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
            apiKey: $payload->model('apiKey', ApiKeyDto::fromArray(...)),
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
            'apiKey' => $this->apiKey->toArray(),
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
