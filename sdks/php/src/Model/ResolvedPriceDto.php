<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\PriceSource;
use Crossmart\Enum\PriceWarning;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ResolvedPriceDto implements JsonSerializable
{
    /**
     * @param list<PriceStepDto> $steps
     * @param list<PriceWarning|string> $warnings
     * @param string|null $unitCost The variant cost in the channel currency, converted like the price
     */
    public function __construct(
        public readonly string $price,
        public readonly ?string $compareAtPrice,
        public readonly PriceSource|string $source,
        public readonly array $steps,
        public readonly string $explanation,
        public readonly array $warnings,
        public readonly ?string $unitCost,
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
            price: $payload->string('price'),
            compareAtPrice: $payload->isNull('compareAtPrice') ? null : $payload->string('compareAtPrice'),
            source: $payload->enum('source', PriceSource::class),
            steps: $payload->modelList('steps', PriceStepDto::fromArray(...)),
            explanation: $payload->string('explanation'),
            warnings: $payload->enumList('warnings', PriceWarning::class),
            unitCost: $payload->isNull('unitCost') ? null : $payload->string('unitCost'),
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
            'price' => $this->price,
            'compareAtPrice' => $this->compareAtPrice,
            'source' => Payload::enumValue($this->source),
            'steps' => array_map(static fn (PriceStepDto $item): array => $item->toArray(), $this->steps),
            'explanation' => $this->explanation,
            'warnings' => array_map(Payload::enumValue(...), $this->warnings),
            'unitCost' => $this->unitCost,
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
