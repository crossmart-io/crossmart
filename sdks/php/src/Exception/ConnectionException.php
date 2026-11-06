<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use RuntimeException;

/**
 * The API could not be reached, or the HTTP client failed before an answer came back.
 */
final class ConnectionException extends RuntimeException implements CrossmartExceptionInterface
{
}
