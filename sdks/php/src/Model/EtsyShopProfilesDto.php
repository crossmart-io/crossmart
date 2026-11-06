<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EtsyShopProfilesDto implements JsonSerializable
{
    /**
     * @param list<EtsyProfileDto> $shipping
     * @param list<EtsyProfileDto> $processing Processing profiles: whether items are ready to ship or made to order, and how long they take
     */
    public function __construct(
        public readonly array $shipping,
        public readonly array $processing,
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
            shipping: $payload->modelList('shipping', EtsyProfileDto::fromArray(...)),
            processing: $payload->modelList('processing', EtsyProfileDto::fromArray(...)),
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
            'shipping' => array_map(static fn (EtsyProfileDto $item): array => $item->toArray(), $this->shipping),
            'processing' => array_map(static fn (EtsyProfileDto $item): array => $item->toArray(), $this->processing),
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
