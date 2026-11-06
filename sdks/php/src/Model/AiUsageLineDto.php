<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\AiFeature;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class AiUsageLineDto implements JsonSerializable
{
    public function __construct(
        public readonly int|float $calls,
        public readonly int|float $inputTokens,
        public readonly int|float $outputTokens,
        public readonly AiFeature|string $feature,
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
            calls: $payload->number('calls'),
            inputTokens: $payload->number('inputTokens'),
            outputTokens: $payload->number('outputTokens'),
            feature: $payload->enum('feature', AiFeature::class),
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
            'calls' => $this->calls,
            'inputTokens' => $this->inputTokens,
            'outputTokens' => $this->outputTokens,
            'feature' => Payload::enumValue($this->feature),
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
