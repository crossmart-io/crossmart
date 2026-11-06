<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class SyncProgressDto implements JsonSerializable
{
    /**
     * @param int|float $pending Listings whose publish, update or delist a sync or retry queued and whose job has not finished yet (each shows `syncRequestedAt`, and `displayState: publishing` while selected)
     * @param int|float $failed The store’s listings in error now, whatever queued them
     * @param bool $done True once nothing a sync or retry queued is still pending
     */
    public function __construct(
        public readonly int|float $pending,
        public readonly int|float $failed,
        public readonly bool $done,
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
            pending: $payload->number('pending'),
            failed: $payload->number('failed'),
            done: $payload->bool('done'),
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
            'pending' => $this->pending,
            'failed' => $this->failed,
            'done' => $this->done,
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
