<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `answered` from the cited pages; `unknown` when the docs do not answer it (the answer points to support); `out_of_scope` when it is not about Crossmart
 */
enum AskOutcome: string
{
    case Answered = 'answered';
    case Unknown = 'unknown';
    case OutOfScope = 'out_of_scope';
}
