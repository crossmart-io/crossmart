<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum SuggestionCreatorType: string
{
    case Agent = 'AGENT';
    case User = 'USER';
    case ApiKey = 'API_KEY';
}
