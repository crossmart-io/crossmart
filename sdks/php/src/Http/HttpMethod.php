<?php

declare(strict_types=1);

namespace Crossmart\Http;

enum HttpMethod: string
{
    case Get = 'GET';
    case Put = 'PUT';
    case Post = 'POST';
    case Delete = 'DELETE';
    case Patch = 'PATCH';
    case Head = 'HEAD';
    case Options = 'OPTIONS';

    /**
     * Whether sending the request twice has the same effect as once (RFC 9110, section 9.2.2).
     * Only these methods are retried, so a POST never runs twice.
     */
    public function isIdempotent(): bool
    {
        return match ($this) {
            self::Get, self::Put, self::Delete, self::Head, self::Options => true,
            self::Post, self::Patch => false,
        };
    }
}
