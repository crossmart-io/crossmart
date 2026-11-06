<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EbayBusinessPoliciesDto implements JsonSerializable
{
    /**
     * @param list<EbayPolicyDto> $fulfillment
     * @param list<EbayPolicyDto> $payment
     * @param list<EbayPolicyDto> $return
     */
    public function __construct(
        public readonly array $fulfillment,
        public readonly array $payment,
        public readonly array $return,
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
            fulfillment: $payload->modelList('fulfillment', EbayPolicyDto::fromArray(...)),
            payment: $payload->modelList('payment', EbayPolicyDto::fromArray(...)),
            return: $payload->modelList('return', EbayPolicyDto::fromArray(...)),
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
            'fulfillment' => array_map(static fn (EbayPolicyDto $item): array => $item->toArray(), $this->fulfillment),
            'payment' => array_map(static fn (EbayPolicyDto $item): array => $item->toArray(), $this->payment),
            'return' => array_map(static fn (EbayPolicyDto $item): array => $item->toArray(), $this->return),
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
