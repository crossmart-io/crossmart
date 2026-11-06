<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\GoogleTargetCountry;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class GoogleMerchantSettingsDto implements JsonSerializable
{
    /**
     * @param string|null $homepageUri The website the account claimed; product links must be on it
     * @param bool $homepageClaimed Whether the account verified and claimed its website
     * @param string $currencyCode ISO 4217 code of the country’s currency
     * @param string $contentLanguage The language listings are written in
     * @param GoogleListingSetupDto|null $listingSetup Null until the merchant saves it; publishing needs it
     * @param bool $readyToList Whether the listing setup is saved, so products can be listed
     */
    public function __construct(
        public readonly string $accountId,
        public readonly string $accountName,
        public readonly ?string $homepageUri,
        public readonly bool $homepageClaimed,
        public readonly GoogleTargetCountry|string $country,
        public readonly string $currencyCode,
        public readonly string $contentLanguage,
        public readonly ?GoogleListingSetupDto $listingSetup,
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
            accountId: $payload->string('accountId'),
            accountName: $payload->string('accountName'),
            homepageUri: $payload->isNull('homepageUri') ? null : $payload->string('homepageUri'),
            homepageClaimed: $payload->bool('homepageClaimed'),
            country: $payload->enum('country', GoogleTargetCountry::class),
            currencyCode: $payload->string('currencyCode'),
            contentLanguage: $payload->string('contentLanguage'),
            listingSetup: $payload->isNull('listingSetup') ? null : $payload->model('listingSetup', GoogleListingSetupDto::fromArray(...)),
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
            'accountId' => $this->accountId,
            'accountName' => $this->accountName,
            'homepageUri' => $this->homepageUri,
            'homepageClaimed' => $this->homepageClaimed,
            'country' => Payload::enumValue($this->country),
            'currencyCode' => $this->currencyCode,
            'contentLanguage' => $this->contentLanguage,
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
