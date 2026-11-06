<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 404: the resource does not exist, or the caller is not in its workspace.
 */
final class NotFoundException extends ApiException
{
}
