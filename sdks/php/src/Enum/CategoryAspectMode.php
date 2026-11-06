<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `selection_only` takes one of `values`; `free_text` takes any text
 */
enum CategoryAspectMode: string
{
    case FreeText = 'free_text';
    case SelectionOnly = 'selection_only';
}
