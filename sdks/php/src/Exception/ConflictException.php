<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 409: the request conflicts with the resource's state, such as a duplicate SKU or a suggestion already reviewed.
 */
final class ConflictException extends ApiException
{
}
