<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ImportJobCountsDto implements JsonSerializable
{
    /**
     * @param int|float $linked Channel products linked to catalog products they matched; zero for file imports
     * @param int|float $updated Products replaced by an update import, variants whose stock an inventory import set, or products a channel import found already linked
     */
    public function __construct(
        public readonly int|float $created,
        public readonly int|float $linked,
        public readonly int|float $updated,
        public readonly int|float $skipped,
        public readonly int|float $failed,
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
            created: $payload->number('created'),
            linked: $payload->number('linked'),
            updated: $payload->number('updated'),
            skipped: $payload->number('skipped'),
            failed: $payload->number('failed'),
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
            'created' => $this->created,
            'linked' => $this->linked,
            'updated' => $this->updated,
            'skipped' => $this->skipped,
            'failed' => $this->failed,
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
