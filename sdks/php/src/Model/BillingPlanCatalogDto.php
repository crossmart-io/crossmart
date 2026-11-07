<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BillingPlanCatalogDto implements JsonSerializable
{
    /**
     * @param list<BillingPlanDto> $plans The offered plans, in order
     * @param string $salesEmail Where to ask about other plans
     */
    public function __construct(
        public readonly array $plans,
        public readonly string $salesEmail,
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
            plans: $payload->modelList('plans', BillingPlanDto::fromArray(...)),
            salesEmail: $payload->string('salesEmail'),
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
            'plans' => array_map(static fn (BillingPlanDto $item): array => $item->toArray(), $this->plans),
            'salesEmail' => $this->salesEmail,
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
