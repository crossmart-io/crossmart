<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\BillingInterval;
use Crossmart\Enum\SubscriptionStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class BillingStatusDto implements JsonSerializable
{
    /**
     * @param bool $enabled Whether this instance bills customers; false when self-hosting, where all is free
     * @param SubscriptionStatus|string $status `INCOMPLETE` until a plan is chosen; `ACTIVE` with no billing account is an organization from before billing
     * @param BillingInterval|string|null $interval How often the subscription renews; null before one starts
     * @param DateTimeImmutable|null $currentPeriodEnd When the subscription renews, or ends when `cancelAtPeriodEnd` is true
     * @param DateTimeImmutable|null $trialEnd When the trial ends (the card is charged then), or ended
     * @param bool $cancelAtPeriodEnd The subscription ends at `currentPeriodEnd` instead of renewing
     * @param bool $hasBillingAccount Whether the billing portal can open (a plan was chosen before)
     * @param bool $trialAvailable Whether choosing a plan now starts with a free trial
     */
    public function __construct(
        public readonly string $organizationId,
        public readonly bool $enabled,
        public readonly PlanDto $plan,
        public readonly SubscriptionStatus|string $status,
        public readonly BillingInterval|string|null $interval,
        public readonly ?DateTimeImmutable $currentPeriodEnd,
        public readonly ?DateTimeImmutable $trialEnd,
        public readonly bool $cancelAtPeriodEnd,
        public readonly SubscriptionAccessDto $access,
        public readonly bool $hasBillingAccount,
        public readonly bool $trialAvailable,
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
            enabled: $payload->bool('enabled'),
            plan: $payload->model('plan', PlanDto::fromArray(...)),
            status: $payload->enum('status', SubscriptionStatus::class),
            interval: $payload->isNull('interval') ? null : $payload->enum('interval', BillingInterval::class),
            currentPeriodEnd: $payload->isNull('currentPeriodEnd') ? null : $payload->dateTime('currentPeriodEnd'),
            trialEnd: $payload->isNull('trialEnd') ? null : $payload->dateTime('trialEnd'),
            cancelAtPeriodEnd: $payload->bool('cancelAtPeriodEnd'),
            access: $payload->model('access', SubscriptionAccessDto::fromArray(...)),
            hasBillingAccount: $payload->bool('hasBillingAccount'),
            trialAvailable: $payload->bool('trialAvailable'),
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
            'enabled' => $this->enabled,
            'plan' => $this->plan->toArray(),
            'status' => Payload::enumValue($this->status),
            'interval' => Payload::enumValue($this->interval),
            'currentPeriodEnd' => $this->currentPeriodEnd === null ? null : Payload::formatDateTime($this->currentPeriodEnd),
            'trialEnd' => $this->trialEnd === null ? null : Payload::formatDateTime($this->trialEnd),
            'cancelAtPeriodEnd' => $this->cancelAtPeriodEnd,
            'access' => $this->access->toArray(),
            'hasBillingAccount' => $this->hasBillingAccount,
            'trialAvailable' => $this->trialAvailable,
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
