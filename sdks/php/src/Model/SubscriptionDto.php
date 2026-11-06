<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SubscriptionStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SubscriptionDto implements JsonSerializable
{
    /**
     * @param DateTimeImmutable|null $currentPeriodEnd When the paid period ends; null until billing is connected
     * @param bool $enforced Whether limits block actions here (402), or are only reported
     * @param list<FeatureUsageDto> $features Every feature, with what the plan allows and what is in use
     */
    public function __construct(
        public readonly string $organizationId,
        public readonly PlanDto $plan,
        public readonly SubscriptionStatus|string $status,
        public readonly ?DateTimeImmutable $currentPeriodEnd,
        public readonly bool $enforced,
        public readonly array $features,
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
            organizationId: $payload->string('organizationId'),
            plan: $payload->model('plan', PlanDto::fromArray(...)),
            status: $payload->enum('status', SubscriptionStatus::class),
            currentPeriodEnd: $payload->isNull('currentPeriodEnd') ? null : $payload->dateTime('currentPeriodEnd'),
            enforced: $payload->bool('enforced'),
            features: $payload->modelList('features', FeatureUsageDto::fromArray(...)),
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
            'organizationId' => $this->organizationId,
            'plan' => $this->plan->toArray(),
            'status' => Payload::enumValue($this->status),
            'currentPeriodEnd' => $this->currentPeriodEnd === null ? null : Payload::formatDateTime($this->currentPeriodEnd),
            'enforced' => $this->enforced,
            'features' => array_map(static fn (FeatureUsageDto $item): array => $item->toArray(), $this->features),
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
