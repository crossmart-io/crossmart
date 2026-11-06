<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EtsyWhenMade;
use Crossmart\Enum\EtsyWhoMade;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EtsyListingSetupDto implements JsonSerializable
{
    /**
     * @param bool $isSupply Whether the items are craft supplies rather than finished products
     * @param string|null $shippingProfileId The shipping profile listings use; null when the shop has none or several and none is chosen
     * @param string|null $processingProfileId The processing profile listings use
     */
    public function __construct(
        public readonly EtsyWhoMade|string $whoMade,
        public readonly EtsyWhenMade|string $whenMade,
        public readonly bool $isSupply,
        public readonly ?string $shippingProfileId,
        public readonly ?string $processingProfileId,
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
            whoMade: $payload->enum('whoMade', EtsyWhoMade::class),
            whenMade: $payload->enum('whenMade', EtsyWhenMade::class),
            isSupply: $payload->bool('isSupply'),
            shippingProfileId: $payload->isNull('shippingProfileId') ? null : $payload->string('shippingProfileId'),
            processingProfileId: $payload->isNull('processingProfileId') ? null : $payload->string('processingProfileId'),
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
            'whoMade' => Payload::enumValue($this->whoMade),
            'whenMade' => Payload::enumValue($this->whenMade),
            'isSupply' => $this->isSupply,
            'shippingProfileId' => $this->shippingProfileId,
            'processingProfileId' => $this->processingProfileId,
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
