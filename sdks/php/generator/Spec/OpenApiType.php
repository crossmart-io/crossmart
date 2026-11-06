<?php

declare(strict_types=1);

namespace Crossmart\Generator\Spec;

/**
 * The `type` and `format` values of OpenAPI 3.0 schemas.
 */
final class OpenApiType
{
    public const STRING = 'string';
    public const NUMBER = 'number';
    public const INTEGER = 'integer';
    public const BOOLEAN = 'boolean';
    public const ARRAY = 'array';
    public const OBJECT = 'object';

    public const FORMAT_UUID = 'uuid';
    public const FORMAT_DATE_TIME = 'date-time';
}
