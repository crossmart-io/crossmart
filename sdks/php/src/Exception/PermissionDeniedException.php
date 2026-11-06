<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 403: the caller's role lacks the permission the route needs.
 */
final class PermissionDeniedException extends ApiException
{
}
