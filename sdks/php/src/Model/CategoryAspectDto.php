<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CategoryAspectMode;
use Crossmart\Enum\CategoryAspectUsage;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CategoryAspectDto implements JsonSerializable
{
    /**
     * @param bool $required The channel refuses listings in the category without it
     * @param CategoryAspectMode|string $mode `selection_only` takes one of `values`; `free_text` takes any text
     * @param bool $multiple Whether a listing may give it several values
     * @param list<string> $values The channel’s values, the first ones only
     */
    public function __construct(
        public readonly string $name,
        public readonly bool $required,
        public readonly CategoryAspectUsage|string $usage,
        public readonly CategoryAspectMode|string $mode,
        public readonly bool $multiple,
        public readonly array $values,
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
            name: $payload->string('name'),
            required: $payload->bool('required'),
            usage: $payload->enum('usage', CategoryAspectUsage::class),
            mode: $payload->enum('mode', CategoryAspectMode::class),
            multiple: $payload->bool('multiple'),
            values: $payload->stringList('values'),
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
            'name' => $this->name,
            'required' => $this->required,
            'usage' => Payload::enumValue($this->usage),
            'mode' => Payload::enumValue($this->mode),
            'multiple' => $this->multiple,
            'values' => $this->values,
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
