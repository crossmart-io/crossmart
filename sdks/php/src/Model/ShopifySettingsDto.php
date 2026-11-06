<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ShopifySettingsDto implements JsonSerializable
{
    /**
     * @param string $currencyCode ISO 4217 code of the store’s currency
     * @param string|null $primaryDomainUrl The storefront’s public URL
     * @param ShopifyLocationDto|null $primaryLocation Where Crossmart reads and writes stock
     */
    public function __construct(
        public readonly string $shopName,
        public readonly string $currencyCode,
        public readonly ?string $ianaTimezone,
        public readonly ?string $primaryDomainUrl,
        public readonly ?ShopifyLocationDto $primaryLocation,
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
            shopName: $payload->string('shopName'),
            currencyCode: $payload->string('currencyCode'),
            ianaTimezone: $payload->isNull('ianaTimezone') ? null : $payload->string('ianaTimezone'),
            primaryDomainUrl: $payload->isNull('primaryDomainUrl') ? null : $payload->string('primaryDomainUrl'),
            primaryLocation: $payload->isNull('primaryLocation') ? null : $payload->model('primaryLocation', ShopifyLocationDto::fromArray(...)),
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
            'shopName' => $this->shopName,
            'currencyCode' => $this->currencyCode,
            'ianaTimezone' => $this->ianaTimezone,
            'primaryDomainUrl' => $this->primaryDomainUrl,
            'primaryLocation' => $this->primaryLocation?->toArray(),
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
