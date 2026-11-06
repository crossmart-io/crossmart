<?php

declare(strict_types=1);

namespace Crossmart\Exception;

use InvalidArgumentException;

/**
 * The client is missing something it needs, such as credentials or a workspace id.
 */
final class ConfigurationException extends InvalidArgumentException implements CrossmartExceptionInterface
{
}
