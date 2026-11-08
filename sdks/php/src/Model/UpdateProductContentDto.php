<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UpdateProductContentDto implements JsonSerializable
{
    /**
     * @param string|null $descriptionHtml HTML; unsafe markup is removed
     */
    public function __construct(
        public readonly ?string $title = null,
        public readonly ?string $descriptionHtml = null,
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
            title: $payload->isNull('title') ? null : $payload->string('title'),
            descriptionHtml: $payload->isNull('descriptionHtml') ? null : $payload->string('descriptionHtml'),
        );
    }

    /**
     * The model in the API's JSON shape.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];
        if ($this->title !== null) {
            $data['title'] = $this->title;
        }
        if ($this->descriptionHtml !== null) {
            $data['descriptionHtml'] = $this->descriptionHtml;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
