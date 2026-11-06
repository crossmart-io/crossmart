<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum EbayCondition: string
{
    case New = 'NEW';
    case LikeNew = 'LIKE_NEW';
    case NewOther = 'NEW_OTHER';
    case NewWithDefects = 'NEW_WITH_DEFECTS';
    case CertifiedRefurbished = 'CERTIFIED_REFURBISHED';
    case ExcellentRefurbished = 'EXCELLENT_REFURBISHED';
    case VeryGoodRefurbished = 'VERY_GOOD_REFURBISHED';
    case GoodRefurbished = 'GOOD_REFURBISHED';
    case SellerRefurbished = 'SELLER_REFURBISHED';
    case UsedExcellent = 'USED_EXCELLENT';
    case UsedVeryGood = 'USED_VERY_GOOD';
    case UsedGood = 'USED_GOOD';
    case UsedAcceptable = 'USED_ACCEPTABLE';
    case ForPartsOrNotWorking = 'FOR_PARTS_OR_NOT_WORKING';
}
