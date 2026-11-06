<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ContentField;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CreateContentDraftDto implements JsonSerializable
{
    /**
     * @param list<ContentField|string> $fields The fields to rewrite
     * @param string|null $connectionId The store the text is for; leave out for the catalog’s own content
     * @param string|null $instruction What to change, such as "shorter" or "mention it is dishwasher-safe"
     * @param string|null $title The title as edited and not yet saved; the saved one when left out
     * @param string|null $descriptionHtml The description as edited and not yet saved; the saved one when left out
     */
    public function __construct(
        public readonly string $productId,
        public readonly array $fields,
        public readonly ?string $connectionId = null,
        public readonly ?string $instruction = null,
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
            productId: $payload->string('productId'),
            fields: $payload->enumList('fields', ContentField::class),
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
            instruction: $payload->isNull('instruction') ? null : $payload->string('instruction'),
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
        $data = [
            'productId' => $this->productId,
            'fields' => array_map(Payload::enumValue(...), $this->fields),
        ];
        if ($this->connectionId !== null) {
            $data['connectionId'] = $this->connectionId;
        }
        if ($this->instruction !== null) {
            $data['instruction'] = $this->instruction;
        }
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
