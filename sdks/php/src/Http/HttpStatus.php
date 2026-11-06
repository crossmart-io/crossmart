<?php

declare(strict_types=1);

namespace Crossmart\Http;

/**
 * The HTTP status codes the SDK reacts to.
 */
final class HttpStatus
{
    public const BAD_REQUEST = 400;
    public const UNAUTHORIZED = 401;
    public const PAYMENT_REQUIRED = 402;
    public const FORBIDDEN = 403;
    public const NOT_FOUND = 404;
    public const CONFLICT = 409;
    public const TOO_MANY_REQUESTS = 429;
    public const INTERNAL_SERVER_ERROR = 500;
    public const BAD_GATEWAY = 502;
    public const SERVICE_UNAVAILABLE = 503;
    public const GATEWAY_TIMEOUT = 504;

    /** The lowest status that is an error. */
    public const ERROR_THRESHOLD = 400;
}
