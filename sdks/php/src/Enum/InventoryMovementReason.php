<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * One of RECEIVED, CORRECTION, RETURNED, DAMAGED, LOST, SOLD. The other reasons are recorded by Crossmart.
 */
enum InventoryMovementReason: string
{
    case OpeningBalance = 'OPENING_BALANCE';
    case Adjustment = 'ADJUSTMENT';
    case Correction = 'CORRECTION';
    case Received = 'RECEIVED';
    case Returned = 'RETURNED';
    case Damaged = 'DAMAGED';
    case Lost = 'LOST';
    case Sold = 'SOLD';
    case Imported = 'IMPORTED';
    case OrderShipped = 'ORDER_SHIPPED';
}
