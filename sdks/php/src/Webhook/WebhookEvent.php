<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

use Crossmart\Exception\WebhookSignatureException;

/**
 * The envelope of every webhook delivery, returned by {@see WebhookSignature::verify()}.
 */
final class WebhookEvent
{
    private const STRING_FIELDS = ['id', 'type', 'createdAt', 'workspaceId', 'apiVersion'];
    private const DATA_FIELD = 'data';

    /**
     * @param string $id The event's id. Retries of a delivery carry the same id, so use it to deduplicate.
     * @param string $type Such as `order.created`; compare it with {@see WebhookEventType}.
     * @param string $createdAt When the event happened, as an ISO 8601 string.
     * @param string $apiVersion The API version `data` follows, such as `v1`.
     * @param array<string, mixed> $data The event's payload. Its shape depends on the type.
     */
    public function __construct(
        public readonly string $id,
        public readonly string $type,
        public readonly string $createdAt,
        public readonly string $workspaceId,
        public readonly string $apiVersion,
        public readonly array $data,
    ) {
    }

    /**
     * @param array<mixed> $event The decoded JSON body.
     *
     * @throws WebhookSignatureException when a field is missing or mistyped.
     */
    public static function fromArray(array $event): self
    {
        $fields = [];
        foreach (self::STRING_FIELDS as $field) {
            $fields[] = self::requireString($event, $field);
        }
        [$id, $type, $createdAt, $workspaceId, $apiVersion] = $fields;

        return new self($id, $type, $createdAt, $workspaceId, $apiVersion, self::requireData($event));
    }

    /** The event type as an enum, or null for a type this SDK version does not know yet. */
    public function eventType(): ?WebhookEventType
    {
        return WebhookEventType::tryFrom($this->type);
    }

    /**
     * @param array<mixed> $event
     */
    private static function requireString(array $event, string $field): string
    {
        $value = $event[$field] ?? null;
        if (!is_string($value)) {
            throw new WebhookSignatureException(WebhookSignatureFailure::InvalidPayload);
        }

        return $value;
    }

    /**
     * @param array<mixed> $event
     *
     * @return array<string, mixed>
     */
    private static function requireData(array $event): array
    {
        $data = $event[self::DATA_FIELD] ?? null;
        if (!is_array($data)) {
            throw new WebhookSignatureException(WebhookSignatureFailure::InvalidPayload);
        }
        $object = [];
        foreach ($data as $key => $value) {
            $object[(string) $key] = $value;
        }

        return $object;
    }
}
