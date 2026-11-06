<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * The product on this store, in one state computed by the server: `draft` (not selected for the store), `needs_details` (selected, but the store setup or the product lacks something publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or `removed`.
 */
enum ListingDisplayState: string
{
    case Draft = 'draft';
    case NeedsDetails = 'needs_details';
    case Ready = 'ready';
    case Publishing = 'publishing';
    case Published = 'published';
    case Failed = 'failed';
    case Removing = 'removing';
    case Removed = 'removed';
}
