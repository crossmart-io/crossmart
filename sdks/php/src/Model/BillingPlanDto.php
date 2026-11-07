<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BillingPlanDto implements JsonSerializable
{
    /**
     * @param int|float $version The plan version new subscriptions get
     * @param list<PlanGrantDto> $features What the plan includes, every feature
     * @param list<PlanPriceDto> $prices Monthly first; empty for a plan that is not sold online
     * @param bool $selfServe False for plans sold by contacting sales, such as Enterprise
     */
    public function __construct(
        public readonly string $code,
        public readonly string $name,
        public readonly int|float $version,
        public readonly array $features,
        public readonly array $prices,
        public readonly bool $selfServe,
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
            code: $payload->string('code'),
            name: $payload->string('name'),
            version: $payload->number('version'),
            features: $payload->modelList('features', PlanGrantDto::fromArray(...)),
            prices: $payload->modelList('prices', PlanPriceDto::fromArray(...)),
            selfServe: $payload->bool('selfServe'),
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
            'code' => $this->code,
            'name' => $this->name,
            'version' => $this->version,
            'features' => array_map(static fn (PlanGrantDto $item): array => $item->toArray(), $this->features),
            'prices' => array_map(static fn (PlanPriceDto $item): array => $item->toArray(), $this->prices),
            'selfServe' => $this->selfServe,
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
