<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class AiUsageReportDto implements JsonSerializable
{
    /**
     * @param list<AiUsageLineDto> $lines
     */
    public function __construct(
        public readonly DateTimeImmutable $from,
        public readonly DateTimeImmutable $to,
        public readonly AiUsageTotalsDto $totals,
        public readonly array $lines,
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
            from: $payload->dateTime('from'),
            to: $payload->dateTime('to'),
            totals: $payload->model('totals', AiUsageTotalsDto::fromArray(...)),
            lines: $payload->modelList('lines', AiUsageLineDto::fromArray(...)),
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
            'from' => Payload::formatDateTime($this->from),
            'to' => Payload::formatDateTime($this->to),
            'totals' => $this->totals->toArray(),
            'lines' => array_map(static fn (AiUsageLineDto $item): array => $item->toArray(), $this->lines),
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
