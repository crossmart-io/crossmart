<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * The first step still to take; null once every step is done
 */
enum GettingStartedStep: string
{
    case VerifyEmail = 'verify_email';
    case ClaimAccount = 'claim_account';
    case AddProducts = 'add_products';
    case ReviewProposals = 'review_proposals';
    case ConnectStore = 'connect_store';
    case Publish = 'publish';
}
