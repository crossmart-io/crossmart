<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\Feature;
use Crossmart\Enum\FeatureKind;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PlanGrantDto implements JsonSerializable
{
    /**
     * @param bool $enabled Whether the plan includes the feature
     * @param int|float|null $limit How many the plan allows; null is unlimited, 0 is not included
     */
    public function __construct(
        public readonly Feature|string $feature,
        public readonly FeatureKind|string $kind,
        public readonly bool $enabled,
        public readonly int|float|null $limit,
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
            feature: $payload->enum('feature', Feature::class),
            kind: $payload->enum('kind', FeatureKind::class),
            enabled: $payload->bool('enabled'),
            limit: $payload->isNull('limit') ? null : $payload->number('limit'),
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
            'feature' => Payload::enumValue($this->feature),
            'kind' => Payload::enumValue($this->kind),
            'enabled' => $this->enabled,
            'limit' => $this->limit,
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
