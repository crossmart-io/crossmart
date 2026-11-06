<?php

declare(strict_types=1);

namespace Crossmart\Http;

use Crossmart\Exception\InvalidPayloadException;
use Crossmart\Serialization\Payload;
use JsonException;

/**
 * A successful answer of the API.
 */
final class ApiResponse
{
    private const BODY_CONTEXT = 'The response body';

    /**
     * @param array<string, list<string>> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly string $body,
        public readonly array $headers = [],
    ) {
    }

    /**
     * The body, decoded as a JSON object.
     *
     * @return array<string, mixed>
     */
    public function object(): array
    {
        return Payload::toObject($this->decode(), self::BODY_CONTEXT);
    }

    /**
     * The body, decoded as a JSON array of objects.
     *
     * @return list<array<string, mixed>>
     */
    public function objectList(): array
    {
        $decoded = $this->decode();
        if (!is_array($decoded) || !array_is_list($decoded)) {
            throw InvalidPayloadException::unexpectedType(self::BODY_CONTEXT, 'a list', $decoded);
        }

        return array_map(static fn (mixed $item): array => Payload::toObject($item, self::BODY_CONTEXT), $decoded);
    }

    private function decode(): mixed
    {
        try {
            return json_decode($this->body, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw InvalidPayloadException::invalidJson($exception->getMessage());
        }
    }
}
