<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\FalabellaCountry;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class FalabellaSettingsDto implements JsonSerializable
{
    /**
     * @param string $userId The Seller Center user whose key is used
     * @param string $currencyCode ISO 4217 code of the country’s currency
     */
    public function __construct(
        public readonly FalabellaCountry|string $country,
        public readonly string $sellerId,
        public readonly string $userId,
        public readonly string $currencyCode,
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
            country: $payload->enum('country', FalabellaCountry::class),
            sellerId: $payload->string('sellerId'),
            userId: $payload->string('userId'),
            currencyCode: $payload->string('currencyCode'),
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
            'country' => Payload::enumValue($this->country),
            'sellerId' => $this->sellerId,
            'userId' => $this->userId,
            'currencyCode' => $this->currencyCode,
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
