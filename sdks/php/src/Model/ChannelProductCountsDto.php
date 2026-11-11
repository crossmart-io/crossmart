<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ChannelProductCountsDto implements JsonSerializable
{
    /**
     * @param int|float $listed Selected and on the channel
     * @param int|float $pending Selected, waiting for the next sync to publish them
     * @param int|float $failed Their last sync failed
     * @param int|float $removing On the channel but no longer selected; the next sync delists them
     * @param int|float $removed_by_hand Removed by hand and off the channel; adding them back undoes it
     * @param int|float $excluded Neither selected nor on the channel
     * @param int|float $needsDetails Products whose display state is `needs_details`: selected, and the store setup or the product lacks something publishing needs. Some may also be counted as `failed`
     * @param int|float $needsAttention Products that are failed or need details, each counted once: what `view=needs_attention` lists. Its failed part is `failed`, the same listings the attention summary counts
     */
    public function __construct(
        public readonly int|float $listed,
        public readonly int|float $pending,
        public readonly int|float $failed,
        public readonly int|float $removing,
        public readonly int|float $removed_by_hand,
        public readonly int|float $excluded,
        public readonly int|float $needsDetails,
        public readonly int|float $needsAttention,
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
            listed: $payload->number('listed'),
            pending: $payload->number('pending'),
            failed: $payload->number('failed'),
            removing: $payload->number('removing'),
            removed_by_hand: $payload->number('removed_by_hand'),
            excluded: $payload->number('excluded'),
            needsDetails: $payload->number('needsDetails'),
            needsAttention: $payload->number('needsAttention'),
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
            'listed' => $this->listed,
            'pending' => $this->pending,
            'failed' => $this->failed,
            'removing' => $this->removing,
            'removed_by_hand' => $this->removed_by_hand,
            'excluded' => $this->excluded,
            'needsDetails' => $this->needsDetails,
            'needsAttention' => $this->needsAttention,
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
