<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\EbayMarketplaceId;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class EbaySettingsDto implements JsonSerializable
{
    /**
     * @param string $currencyCode ISO 4217 code of the marketplace’s currency
     * @param string $userId eBay’s immutable id of the user
     * @param bool $businessPoliciesEnabled False when the account has not opted in to business policies on eBay
     * @param EbayListingDefaultsDto $listingDefaults What listings are published with; policies resolve to the only one of a type
     * @param bool $readyToList Whether listings can be published: policies of each type and a ship-from set
     */
    public function __construct(
        public readonly EbayMarketplaceId|string $marketplaceId,
        public readonly string $currencyCode,
        public readonly string $username,
        public readonly string $userId,
        public readonly bool $businessPoliciesEnabled,
        public readonly EbayBusinessPoliciesDto $policies,
        public readonly EbayListingDefaultsDto $listingDefaults,
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
            marketplaceId: $payload->enum('marketplaceId', EbayMarketplaceId::class),
            currencyCode: $payload->string('currencyCode'),
            username: $payload->string('username'),
            userId: $payload->string('userId'),
            businessPoliciesEnabled: $payload->bool('businessPoliciesEnabled'),
            policies: $payload->model('policies', EbayBusinessPoliciesDto::fromArray(...)),
            listingDefaults: $payload->model('listingDefaults', EbayListingDefaultsDto::fromArray(...)),
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
            'marketplaceId' => Payload::enumValue($this->marketplaceId),
            'currencyCode' => $this->currencyCode,
            'username' => $this->username,
            'userId' => $this->userId,
            'businessPoliciesEnabled' => $this->businessPoliciesEnabled,
            'policies' => $this->policies->toArray(),
            'listingDefaults' => $this->listingDefaults->toArray(),
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
