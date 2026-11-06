<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AiStatusDto implements JsonSerializable
{
    /**
     * @param bool $configured False until the server has an AI provider key
     */
    public function __construct(
        public readonly bool $configured,
        public readonly string $provider,
        public readonly string $model,
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
            configured: $payload->bool('configured'),
            provider: $payload->string('provider'),
            model: $payload->string('model'),
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
            'configured' => $this->configured,
            'provider' => $this->provider,
            'model' => $this->model,
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
