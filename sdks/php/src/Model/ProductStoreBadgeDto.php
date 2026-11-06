<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ChannelType;
use Crossmart\Enum\ListingDisplayState;
use Crossmart\Enum\ListingSource;
use Crossmart\Enum\ListingStatus;
use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ProductStoreBadgeDto implements JsonSerializable
{
    /**
     * @param ListingDisplayState|string $displayState The product on this store, in one state computed by the server: `draft` (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or `removed`.
     * @param string|null $displayReason For `needs_details` and `failed`: a short, merchant-readable reason (what to add, or the channel’s message). Never holds secrets. Null for the other states.
     * @param PublishRequirement|string|null $displayRequirement For `needs_details`: the requirement to fix first, so a client can open the right place. Store-setup requirements (`reconnect`, `account_settings`, `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`, `listing_setup`) come before the product’s (`images`, `active_product`, `option_names`), which the server checks before publishing; `category` and `item_specifics` are known once the channel refused a publish. Null for the other states.
     */
    public function __construct(
        public readonly string $connectionId,
        public readonly ChannelType|string $channel,
        public readonly string $storeName,
        public readonly ListingStatus|string $status,
        public readonly ListingSource|string $source,
        public readonly ListingDisplayState|string $displayState,
        public readonly ?string $displayReason,
        public readonly PublishRequirement|string|null $displayRequirement,
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
            connectionId: $payload->string('connectionId'),
            channel: $payload->enum('channel', ChannelType::class),
            storeName: $payload->string('storeName'),
            status: $payload->enum('status', ListingStatus::class),
            source: $payload->enum('source', ListingSource::class),
            displayState: $payload->enum('displayState', ListingDisplayState::class),
            displayReason: $payload->isNull('displayReason') ? null : $payload->string('displayReason'),
            displayRequirement: $payload->isNull('displayRequirement') ? null : $payload->enum('displayRequirement', PublishRequirement::class),
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
            'connectionId' => $this->connectionId,
            'channel' => Payload::enumValue($this->channel),
            'storeName' => $this->storeName,
            'status' => Payload::enumValue($this->status),
            'source' => Payload::enumValue($this->source),
            'displayState' => Payload::enumValue($this->displayState),
            'displayReason' => $this->displayReason,
            'displayRequirement' => Payload::enumValue($this->displayRequirement),
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
