<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingCategoryFieldDto implements JsonSerializable
{
    /**
     * @param bool $supported Whether the channel has categories (eBay)
     * @param ChannelCategoryDto|null $value Null until the merchant chose one or a publish picked one
     */
    public function __construct(
        public readonly bool $supported,
        public readonly ?ChannelCategoryDto $value,
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
            supported: $payload->bool('supported'),
            value: $payload->isNull('value') ? null : $payload->model('value', ChannelCategoryDto::fromArray(...)),
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
            'supported' => $this->supported,
            'value' => $this->value?->toArray(),
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
