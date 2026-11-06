<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SyncRequestResultDto implements JsonSerializable
{
    /**
     * @param int|float $queued Selected products queued to be published or updated. With `delisting`, the total a progress bar counts down from `GET …/sync`’s `pending`.
     * @param int|float $delisting Listings queued to be delisted, as they are no longer selected
     */
    public function __construct(
        public readonly int|float $queued,
        public readonly int|float $delisting,
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
            queued: $payload->number('queued'),
            delisting: $payload->number('delisting'),
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
            'queued' => $this->queued,
            'delisting' => $this->delisting,
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
