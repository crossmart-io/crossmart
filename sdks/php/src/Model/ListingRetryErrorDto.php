<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Model;

use Crossmart\Enum\ListingRetryErrorCode;
use Crossmart\Serialization\Payload;
use JsonSerializable;

final class ListingRetryErrorDto implements JsonSerializable
{
    /**
     * @param ListingRetryErrorCode|string $code `store_not_connected`: the store needs re-auth, was disconnected or is in error; reconnect it. `product_not_in_store`: the store does not select the product; add it.
     */
    public function __construct(
        public readonly int|float $statusCode,
        public readonly string $error,
        public readonly ListingRetryErrorCode|string $code,
        public readonly string $message,
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
            statusCode: $payload->number('statusCode'),
            error: $payload->string('error'),
            code: $payload->enum('code', ListingRetryErrorCode::class),
            message: $payload->string('message'),
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
            'statusCode' => $this->statusCode,
            'error' => $this->error,
            'code' => Payload::enumValue($this->code),
            'message' => $this->message,
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
