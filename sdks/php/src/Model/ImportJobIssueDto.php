<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ImportIssueCode;
use Crossmart\Enum\ImportIssueOutcome;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ImportJobIssueDto implements JsonSerializable
{
    /**
     * @param int|float|null $row Spreadsheet row number; the header is row 1
     */
    public function __construct(
        public readonly ImportIssueCode|string $code,
        public readonly string $message,
        public readonly ImportIssueOutcome|string $outcome,
        public readonly ?string $handle = null,
        public readonly ?string $sku = null,
        public readonly int|float|null $row = null,
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
            code: $payload->enum('code', ImportIssueCode::class),
            message: $payload->string('message'),
            outcome: $payload->enum('outcome', ImportIssueOutcome::class),
            handle: $payload->isNull('handle') ? null : $payload->string('handle'),
            sku: $payload->isNull('sku') ? null : $payload->string('sku'),
            row: $payload->isNull('row') ? null : $payload->number('row'),
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
            'code' => Payload::enumValue($this->code),
            'message' => $this->message,
            'outcome' => Payload::enumValue($this->outcome),
        ];
        if ($this->handle !== null) {
            $data['handle'] = $this->handle;
        }
        if ($this->sku !== null) {
            $data['sku'] = $this->sku;
        }
        if ($this->row !== null) {
            $data['row'] = $this->row;
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
