<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class StartAuthorizationDto implements JsonSerializable
{
    /**
     * @param string $accountHandle The account to connect. For Shopify, the store’s myshopify.com domain or handle. For eBay, the marketplace id, such as `EBAY_US`. For Etsy, the shop name (the merchant must sign in to that shop). For Mercado Libre, the country site id, such as `MLM`.
     */
    public function __construct(
        public readonly ChannelType|string $channel,
        public readonly string $accountHandle,
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
            channel: $payload->enum('channel', ChannelType::class),
            accountHandle: $payload->string('accountHandle'),
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
            'channel' => Payload::enumValue($this->channel),
            'accountHandle' => $this->accountHandle,
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
