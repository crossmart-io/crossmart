<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogImportFormat;
use Crossmart\Enum\CatalogImportMode;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ImportProductsDto implements JsonSerializable
{
    /**
     * @param CatalogImportMode|string|null $mode `create` adds new products (Shopify CSV), `update` replaces products matched by handle (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV)
     */
    public function __construct(
        public readonly CatalogImportFormat|string $format,
        public readonly CatalogImportMode|string|null $mode = null,
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
            format: $payload->enum('format', CatalogImportFormat::class),
            mode: $payload->isNull('mode') ? null : $payload->enum('mode', CatalogImportMode::class),
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
            'format' => Payload::enumValue($this->format),
        ];
        if ($this->mode !== null) {
            $data['mode'] = Payload::enumValue($this->mode);
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
