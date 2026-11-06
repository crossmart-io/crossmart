<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EbayShipFromDto implements JsonSerializable
{
    /**
     * @param string $country ISO 3166 alpha-2 country code
     */
    public function __construct(
        public readonly string $postalCode,
        public readonly string $country,
        public readonly ?string $city,
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
            postalCode: $payload->string('postalCode'),
            country: $payload->string('country'),
            city: $payload->isNull('city') ? null : $payload->string('city'),
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
            'postalCode' => $this->postalCode,
            'country' => $this->country,
            'city' => $this->city,
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
