<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\SubscriptionAccessState;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class SubscriptionAccessDto implements JsonSerializable
{
    /**
     * @param SubscriptionAccessState|string $state `unrestricted` where billing is off; `trialing`, `active`, `past_due_grace`, `legacy` and `sandbox` keep full access; the others are read-only while billing is enforced
     * @param bool $writable False when the organization is read-only. Changes are refused (402 `subscription_inactive`) only while `enforced` is true
     * @param bool $enforced Whether a read-only organization is refused changes on this instance
     * @param DateTimeImmutable|null $until When the state ends on its own: the trial, the past-due grace period, or access for organizations from before billing. Null when it does not
     */
    public function __construct(
        public readonly SubscriptionAccessState|string $state,
        public readonly bool $writable,
        public readonly bool $enforced,
        public readonly ?DateTimeImmutable $until,
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
            state: $payload->enum('state', SubscriptionAccessState::class),
            writable: $payload->bool('writable'),
            enforced: $payload->bool('enforced'),
            until: $payload->isNull('until') ? null : $payload->dateTime('until'),
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
            'state' => Payload::enumValue($this->state),
            'writable' => $this->writable,
            'enforced' => $this->enforced,
            'until' => $this->until === null ? null : Payload::formatDateTime($this->until),
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
