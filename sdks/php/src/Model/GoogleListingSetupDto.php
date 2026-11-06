<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\GoogleTargetCountry;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class GoogleListingSetupDto implements JsonSerializable
{
    /**
     * @param string $dataSourceId The Merchant Center API data source Crossmart publishes into
     */
    public function __construct(
        public readonly GoogleTargetCountry|string $country,
        public readonly string $productUrlTemplate,
        public readonly string $dataSourceId,
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
            dataSourceId: $payload->string('dataSourceId'),
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
            'dataSourceId' => $this->dataSourceId,
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
