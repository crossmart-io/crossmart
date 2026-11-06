<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use Throwable;

/**
 * Implemented by every exception the SDK throws, so one `catch` can handle them all.
 */
interface CrossmartExceptionInterface extends Throwable
{
}
