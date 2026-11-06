<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\CatalogImportFormat;
use Crossmart\Enum\CatalogImportMode;
use Crossmart\Enum\ImportJobStatus;
use Crossmart\Serialization\Payload;
use DateTimeImmutable;
use JsonSerializable;

final class ImportJobDetailDto implements JsonSerializable
{
    /**
     * @param string $fileName The file name, or the channel account a channel import read
     * @param string|null $connectionId The channel connection a channel import reads; null for file imports
     * @param int|float|null $totalCount Records the source holds, when it reports them, to show progress
     * @param ImportJobCountsDto $counts Products for create and update imports; stock rows for inventory imports
     * @param string|null $errorMessage Why the whole file was rejected
     * @param list<ImportJobIssueDto> $issues Skipped and failed records, in file order
     */
    public function __construct(
        public readonly string $id,
        public readonly CatalogImportMode|string $mode,
        public readonly CatalogImportFormat|string $format,
        public readonly string $fileName,
        public readonly ?string $connectionId,
        public readonly int|float|null $totalCount,
        public readonly ImportJobStatus|string $status,
        public readonly ImportJobCountsDto $counts,
        public readonly ?string $errorMessage,
        public readonly ImportJobActorDto $actor,
        public readonly DateTimeImmutable $createdAt,
        public readonly ?DateTimeImmutable $finishedAt,
        public readonly array $issues,
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
            id: $payload->string('id'),
            mode: $payload->enum('mode', CatalogImportMode::class),
            format: $payload->enum('format', CatalogImportFormat::class),
            fileName: $payload->string('fileName'),
            connectionId: $payload->isNull('connectionId') ? null : $payload->string('connectionId'),
            totalCount: $payload->isNull('totalCount') ? null : $payload->number('totalCount'),
            status: $payload->enum('status', ImportJobStatus::class),
            counts: $payload->model('counts', ImportJobCountsDto::fromArray(...)),
            errorMessage: $payload->isNull('errorMessage') ? null : $payload->string('errorMessage'),
            actor: $payload->model('actor', ImportJobActorDto::fromArray(...)),
            createdAt: $payload->dateTime('createdAt'),
            finishedAt: $payload->isNull('finishedAt') ? null : $payload->dateTime('finishedAt'),
            issues: $payload->modelList('issues', ImportJobIssueDto::fromArray(...)),
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
            'id' => $this->id,
            'mode' => Payload::enumValue($this->mode),
            'format' => Payload::enumValue($this->format),
            'fileName' => $this->fileName,
            'connectionId' => $this->connectionId,
            'totalCount' => $this->totalCount,
            'status' => Payload::enumValue($this->status),
            'counts' => $this->counts->toArray(),
            'errorMessage' => $this->errorMessage,
            'actor' => $this->actor->toArray(),
            'createdAt' => Payload::formatDateTime($this->createdAt),
            'finishedAt' => $this->finishedAt === null ? null : Payload::formatDateTime($this->finishedAt),
            'issues' => array_map(static fn (ImportJobIssueDto $item): array => $item->toArray(), $this->issues),
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
