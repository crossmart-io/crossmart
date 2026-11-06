<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\PublishRequirement;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class PublishReadinessDto implements JsonSerializable
{
    /**
     * @param bool $ready True when listings can be published to this store
     * @param list<PublishRequirement|string> $missing What to finish before publishing, in order; empty when ready. `reconnect` alone when the store needs to be connected again. eBay: `shipping_policy`, `payment_policy`, `return_policy`, `ship_from_location`. Google: `listing_setup`. Etsy: `item_details`, `shipping_profile`, `processing_profile`. `account_settings` when the account was never read.
     */
    public function __construct(
        public readonly bool $ready,
        public readonly array $missing,
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
            ready: $payload->bool('ready'),
            missing: $payload->enumList('missing', PublishRequirement::class),
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
            'ready' => $this->ready,
            'missing' => array_map(Payload::enumValue(...), $this->missing),
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
