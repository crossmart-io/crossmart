<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ImportIssueCode: string
{
    case AlreadyExists = 'already_exists';
    case DuplicateSku = 'duplicate_sku';
    case InvalidValue = 'invalid_value';
    case MissingValue = 'missing_value';
    case InvalidOptions = 'invalid_options';
    case NotFound = 'not_found';
    case UnknownSku = 'unknown_sku';
    case NotTracked = 'not_tracked';
    case DuplicateRow = 'duplicate_row';
    case UnmatchedVariant = 'unmatched_variant';
    case AlreadyLinked = 'already_linked';
}
