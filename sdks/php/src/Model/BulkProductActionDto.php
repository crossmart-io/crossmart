<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\BulkProductAction;
use Crossmart\Enum\ProductStatus;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class BulkProductActionDto implements JsonSerializable
{
    /**
     * @param list<string> $productIds
     * @param ProductStatus|string|null $status Required for `set_status`
     * @param list<string>|null $tags Required for `add_tags` and `remove_tags`
     * @param int|float|null $percent Required for `adjust_prices`. 10 raises every price by 10%, -15 lowers it by 15%.
     */
    public function __construct(
        public readonly array $productIds,
        public readonly BulkProductAction|string $action,
        public readonly ProductStatus|string|null $status = null,
        public readonly ?array $tags = null,
        public readonly int|float|null $percent = null,
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
            productIds: $payload->stringList('productIds'),
            action: $payload->enum('action', BulkProductAction::class),
            status: $payload->isNull('status') ? null : $payload->enum('status', ProductStatus::class),
            tags: $payload->isNull('tags') ? null : $payload->stringList('tags'),
            percent: $payload->isNull('percent') ? null : $payload->number('percent'),
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
            'productIds' => $this->productIds,
            'action' => Payload::enumValue($this->action),
        ];
        if ($this->status !== null) {
            $data['status'] = Payload::enumValue($this->status);
        }
        if ($this->tags !== null) {
            $data['tags'] = $this->tags;
        }
        if ($this->percent !== null) {
            $data['percent'] = $this->percent;
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
