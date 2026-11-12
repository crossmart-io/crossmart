<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\FalabellaCountry;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class FalabellaCredentialsDto implements JsonSerializable
{
    /**
     * @param string $sellerId The seller id, under Mi cuenta in Seller Center
     * @param string $userId The Seller Center user’s email (Mi cuenta, Usuarios). See https://developers.falabella.com/docs/operate-with-apis
     * @param string $apiKey The user’s API key, from the Api Key column of Mi cuenta, Usuarios. Stored encrypted; never returned.
     * @param FalabellaCountry|string $country The country the account sells in: facl Chile, faco Colombia, fape Peru
     */
    public function __construct(
        public readonly string $sellerId,
        public readonly string $userId,
        public readonly string $apiKey,
        public readonly FalabellaCountry|string $country,
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
            sellerId: $payload->string('sellerId'),
            userId: $payload->string('userId'),
            apiKey: $payload->string('apiKey'),
            country: $payload->enum('country', FalabellaCountry::class),
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
            'sellerId' => $this->sellerId,
            'userId' => $this->userId,
            'apiKey' => $this->apiKey,
            'country' => Payload::enumValue($this->country),
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
