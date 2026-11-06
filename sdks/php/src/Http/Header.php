<?php

declare(strict_types=1);

namespace Crossmart\Http;

/**
 * HTTP headers the SDK reads or sends.
 */
enum Header: string
{
    case ApiKey = 'x-api-key';
    case Authorization = 'authorization';
    case Accept = 'accept';
    case ContentType = 'content-type';
    case UserAgent = 'user-agent';
    case RetryAfter = 'retry-after';
}
