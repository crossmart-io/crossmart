<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingHealthReportDto implements JsonSerializable
{
    /**
     * @param list<StoreListingHealthDto> $stores Every store, oldest first
     * @param list<StoreListingFailureDto> $recentFailures The latest listings a channel refused, latest first, each with its display state and requirement so a client can link to the fix
     * @param int|float $failedListings Failed listings in all, across the stores
     */
    public function __construct(
        public readonly array $stores,
        public readonly array $recentFailures,
        public readonly int|float $failedListings,
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
            stores: $payload->modelList('stores', StoreListingHealthDto::fromArray(...)),
            recentFailures: $payload->modelList('recentFailures', StoreListingFailureDto::fromArray(...)),
            failedListings: $payload->number('failedListings'),
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
            'stores' => array_map(static fn (StoreListingHealthDto $item): array => $item->toArray(), $this->stores),
            'recentFailures' => array_map(static fn (StoreListingFailureDto $item): array => $item->toArray(), $this->recentFailures),
            'failedListings' => $this->failedListings,
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
