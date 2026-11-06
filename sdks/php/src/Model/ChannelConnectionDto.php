<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelConnectionStatus;
use Crossmart\Enum\ChannelFeature;
use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ChannelConnectionDto implements JsonSerializable
{
    /**
     * @param string $externalAccountId The account on the channel
     * @param string|null $statusReason Why it needs re-auth or failed
     * @param list<string> $grantedScopes
     * @param list<ChannelFeature|string> $missingFeatures What the connection cannot do until the merchant approves the app again
     * @param ShopifySettingsDto|null $shopify The store’s details, for Shopify connections
     * @param EbaySettingsDto|null $ebay The account’s details on its marketplace, for eBay connections
     * @param GoogleMerchantSettingsDto|null $googleMerchant The Merchant Center account and its listing setup, for Google connections
     * @param EtsySettingsDto|null $etsy The Etsy shop, its profiles and its listing setup, for Etsy connections
     * @param ProductSelectionRuleDto|null $productSelection Which products the connection lists; null lists every product
     * @param PricingRuleDto|null $pricing How the connection prices variants; null sends catalog prices
     * @param int|float $failedListings Listings in this store whose last sync failed
     * @param PublishReadinessDto $publishReadiness Whether listings can be published here, and what the store setup lacks
     */
    public function __construct(
        public readonly string $id,
        public readonly ChannelType|string $channel,
        public readonly string $externalAccountId,
        public readonly string $displayName,
        public readonly ChannelConnectionStatus|string $status,
        public readonly ?string $statusReason,
        public readonly array $grantedScopes,
        public readonly array $missingFeatures,
        public readonly ?ShopifySettingsDto $shopify,
        public readonly ?EbaySettingsDto $ebay,
        public readonly ?GoogleMerchantSettingsDto $googleMerchant,
        public readonly ?EtsySettingsDto $etsy,
        public readonly ?ProductSelectionRuleDto $productSelection,
        public readonly ?PricingRuleDto $pricing,
        public readonly DateTimeImmutable $connectedAt,
        public readonly ?DateTimeImmutable $disconnectedAt,
        public readonly ?DateTimeImmutable $lastSyncedAt,
        public readonly DateTimeImmutable $createdAt,
        public readonly DateTimeImmutable $updatedAt,
        public readonly int|float $failedListings,
        public readonly PublishReadinessDto $publishReadiness,
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
            id: $payload->string('id'),
            channel: $payload->enum('channel', ChannelType::class),
            externalAccountId: $payload->string('externalAccountId'),
            displayName: $payload->string('displayName'),
            status: $payload->enum('status', ChannelConnectionStatus::class),
            statusReason: $payload->isNull('statusReason') ? null : $payload->string('statusReason'),
            grantedScopes: $payload->stringList('grantedScopes'),
            missingFeatures: $payload->enumList('missingFeatures', ChannelFeature::class),
            shopify: $payload->isNull('shopify') ? null : $payload->model('shopify', ShopifySettingsDto::fromArray(...)),
            ebay: $payload->isNull('ebay') ? null : $payload->model('ebay', EbaySettingsDto::fromArray(...)),
            googleMerchant: $payload->isNull('googleMerchant') ? null : $payload->model('googleMerchant', GoogleMerchantSettingsDto::fromArray(...)),
            etsy: $payload->isNull('etsy') ? null : $payload->model('etsy', EtsySettingsDto::fromArray(...)),
            productSelection: $payload->isNull('productSelection') ? null : $payload->model('productSelection', ProductSelectionRuleDto::fromArray(...)),
            pricing: $payload->isNull('pricing') ? null : $payload->model('pricing', PricingRuleDto::fromArray(...)),
            connectedAt: $payload->dateTime('connectedAt'),
            disconnectedAt: $payload->isNull('disconnectedAt') ? null : $payload->dateTime('disconnectedAt'),
            lastSyncedAt: $payload->isNull('lastSyncedAt') ? null : $payload->dateTime('lastSyncedAt'),
            createdAt: $payload->dateTime('createdAt'),
            updatedAt: $payload->dateTime('updatedAt'),
            failedListings: $payload->number('failedListings'),
            publishReadiness: $payload->model('publishReadiness', PublishReadinessDto::fromArray(...)),
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
            'id' => $this->id,
            'channel' => Payload::enumValue($this->channel),
            'externalAccountId' => $this->externalAccountId,
            'displayName' => $this->displayName,
            'status' => Payload::enumValue($this->status),
            'statusReason' => $this->statusReason,
            'grantedScopes' => $this->grantedScopes,
            'missingFeatures' => array_map(Payload::enumValue(...), $this->missingFeatures),
            'shopify' => $this->shopify?->toArray(),
            'ebay' => $this->ebay?->toArray(),
            'googleMerchant' => $this->googleMerchant?->toArray(),
            'etsy' => $this->etsy?->toArray(),
            'productSelection' => $this->productSelection?->toArray(),
            'pricing' => $this->pricing?->toArray(),
            'connectedAt' => Payload::formatDateTime($this->connectedAt),
            'disconnectedAt' => $this->disconnectedAt === null ? null : Payload::formatDateTime($this->disconnectedAt),
            'lastSyncedAt' => $this->lastSyncedAt === null ? null : Payload::formatDateTime($this->lastSyncedAt),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'updatedAt' => Payload::formatDateTime($this->updatedAt),
            'failedListings' => $this->failedListings,
            'publishReadiness' => $this->publishReadiness->toArray(),
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
