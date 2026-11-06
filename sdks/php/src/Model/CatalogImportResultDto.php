<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogImportMode;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class CatalogImportResultDto implements JsonSerializable
{
    /**
     * @param string $jobId The import history entry of this import
     * @param int|float $updatedProducts Products replaced by an update import
     * @param int|float $updatedVariants Variants whose stock an inventory import set
     * @param list<ImportIssueDto> $skipped Records left as they were: already in the catalog, not found, stock not tracked
     * @param list<ImportIssueDto> $failed Records that could not be imported
     */
    public function __construct(
        public readonly string $jobId,
        public readonly CatalogImportMode|string $mode,
        public readonly int|float $createdProducts,
        public readonly int|float $createdVariants,
        public readonly int|float $updatedProducts,
        public readonly int|float $updatedVariants,
        public readonly array $skipped,
        public readonly array $failed,
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
            jobId: $payload->string('jobId'),
            mode: $payload->enum('mode', CatalogImportMode::class),
            createdProducts: $payload->number('createdProducts'),
            createdVariants: $payload->number('createdVariants'),
            updatedProducts: $payload->number('updatedProducts'),
            updatedVariants: $payload->number('updatedVariants'),
            skipped: $payload->modelList('skipped', ImportIssueDto::fromArray(...)),
            failed: $payload->modelList('failed', ImportIssueDto::fromArray(...)),
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
            'jobId' => $this->jobId,
            'mode' => Payload::enumValue($this->mode),
            'createdProducts' => $this->createdProducts,
            'createdVariants' => $this->createdVariants,
            'updatedProducts' => $this->updatedProducts,
            'updatedVariants' => $this->updatedVariants,
            'skipped' => array_map(static fn (ImportIssueDto $item): array => $item->toArray(), $this->skipped),
            'failed' => array_map(static fn (ImportIssueDto $item): array => $item->toArray(), $this->failed),
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
