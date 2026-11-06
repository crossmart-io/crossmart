<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 429: too many requests. Idempotent requests were already retried before this was thrown.
 */
final class RateLimitException extends ApiException
{
}
