<?php

declare(strict_types=1);

namespace Crossmart\Webhook;

/**
 * Headers of a webhook delivery. HTTP header names are case-insensitive.
 */
enum WebhookHeader: string
{
    case Signature = 'crossmart-signature';
    case EventId = 'crossmart-event-id';
    case EventType = 'crossmart-event-type';
    case DeliveryId = 'crossmart-delivery-id';

    private const SERVER_KEY_PREFIX = 'HTTP_';
    private const NAME_SEPARATOR = '-';
    private const SERVER_KEY_SEPARATOR = '_';

    /** The `$_SERVER` key PHP stores the header under, such as `HTTP_CROSSMART_SIGNATURE`. */
    public function serverKey(): string
    {
        return self::SERVER_KEY_PREFIX
            . strtoupper(str_replace(self::NAME_SEPARATOR, self::SERVER_KEY_SEPARATOR, $this->value));
    }
}
