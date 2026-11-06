<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\GoogleTargetCountry;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateGoogleListingSetupDto implements JsonSerializable
{
    /**
     * @param GoogleTargetCountry|string $country Where listings sell; their currency and language follow
     * @param string $productUrlTemplate Each product’s page on the merchant’s website, with {handle} for its handle
     */
    public function __construct(
        public readonly GoogleTargetCountry|string $country,
        public readonly string $productUrlTemplate,
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
            country: $payload->enum('country', GoogleTargetCountry::class),
            productUrlTemplate: $payload->string('productUrlTemplate'),
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
            'productUrlTemplate' => $this->productUrlTemplate,
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
