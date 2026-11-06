<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ProductStoreFilter: string
{
    case InStore = 'in_store';
    case NotInStore = 'not_in_store';
    case InNoStore = 'in_no_store';
    case WithErrors = 'with_errors';
}
