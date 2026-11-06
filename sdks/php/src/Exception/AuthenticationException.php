<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 401: the API key or access token is missing, wrong, revoked or expired.
 */
final class AuthenticationException extends ApiException
{
}
