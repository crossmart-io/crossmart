<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EbayCondition;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateEbayListingDefaultsDto implements JsonSerializable
{
    /**
     * @param string|null $fulfillmentPolicyId Shipping policy; null uses the account’s only one, when it has exactly one
     * @param EbayShipFromDto|null $location Saved on eBay as the account’s Crossmart inventory location
     */
    public function __construct(
        public readonly ?string $fulfillmentPolicyId,
        public readonly ?string $paymentPolicyId,
        public readonly ?string $returnPolicyId,
        public readonly EbayCondition|string $condition,
        public readonly ?EbayShipFromDto $location,
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
            fulfillmentPolicyId: $payload->isNull('fulfillmentPolicyId') ? null : $payload->string('fulfillmentPolicyId'),
            paymentPolicyId: $payload->isNull('paymentPolicyId') ? null : $payload->string('paymentPolicyId'),
            returnPolicyId: $payload->isNull('returnPolicyId') ? null : $payload->string('returnPolicyId'),
            condition: $payload->enum('condition', EbayCondition::class),
            location: $payload->isNull('location') ? null : $payload->model('location', EbayShipFromDto::fromArray(...)),
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
            'fulfillmentPolicyId' => $this->fulfillmentPolicyId,
            'paymentPolicyId' => $this->paymentPolicyId,
            'returnPolicyId' => $this->returnPolicyId,
            'condition' => Payload::enumValue($this->condition),
            'location' => $this->location?->toArray(),
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
