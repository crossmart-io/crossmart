<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ProductCondition: string
{
    case New = 'NEW';
    case NewOther = 'NEW_OTHER';
    case NewWithDefects = 'NEW_WITH_DEFECTS';
    case LikeNew = 'LIKE_NEW';
    case Refurbished = 'REFURBISHED';
    case UsedExcellent = 'USED_EXCELLENT';
    case UsedVeryGood = 'USED_VERY_GOOD';
    case UsedGood = 'USED_GOOD';
    case UsedFair = 'USED_FAIR';
    case ForParts = 'FOR_PARTS';
}
