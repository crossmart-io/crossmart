<?php

declare(strict_types=1);

namespace Crossmart\Generator\Writer;

/**
 * Writes PHP literals.
 */
final class PhpLiteral
{
    public static function string(string $value): string
    {
        return "'" . str_replace(['\\', "'"], ['\\\\', "\\'"], $value) . "'";
    }
}
