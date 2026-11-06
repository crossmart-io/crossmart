<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EtsySettingsDto implements JsonSerializable
{
    /**
     * @param string $currencyCode ISO 4217 code of the shop’s currency
     * @param EtsyListingSetupDto|null $listingSetup Null until the merchant saves it; publishing needs it
     * @param bool $readyToList Whether the listing setup is complete, so products can be listed
     */
    public function __construct(
        public readonly string $shopId,
        public readonly string $shopName,
        public readonly string $currencyCode,
        public readonly ?string $shopUrl,
        public readonly EtsyShopProfilesDto $profiles,
        public readonly ?EtsyListingSetupDto $listingSetup,
        public readonly bool $readyToList,
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
            shopId: $payload->string('shopId'),
            shopName: $payload->string('shopName'),
            currencyCode: $payload->string('currencyCode'),
            shopUrl: $payload->isNull('shopUrl') ? null : $payload->string('shopUrl'),
            profiles: $payload->model('profiles', EtsyShopProfilesDto::fromArray(...)),
            listingSetup: $payload->isNull('listingSetup') ? null : $payload->model('listingSetup', EtsyListingSetupDto::fromArray(...)),
            readyToList: $payload->bool('readyToList'),
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
            'shopId' => $this->shopId,
            'shopName' => $this->shopName,
            'currencyCode' => $this->currencyCode,
            'shopUrl' => $this->shopUrl,
            'profiles' => $this->profiles->toArray(),
            'listingSetup' => $this->listingSetup?->toArray(),
            'readyToList' => $this->readyToList,
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
