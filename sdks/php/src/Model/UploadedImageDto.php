<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ImageContentType;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class UploadedImageDto implements JsonSerializable
{
    /**
     * @param string $url Use it as a product media `url`
     */
    public function __construct(
        public readonly string $url,
        public readonly ImageContentType|string $contentType,
        public readonly int|float $byteSize,
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
            url: $payload->string('url'),
            contentType: $payload->enum('contentType', ImageContentType::class),
            byteSize: $payload->number('byteSize'),
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
            'url' => $this->url,
            'contentType' => Payload::enumValue($this->contentType),
            'byteSize' => $this->byteSize,
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
