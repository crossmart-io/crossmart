<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Set when connecting failed
 */
enum ConnectFailure: string
{
    case InvalidState = 'invalid_state';
    case ExpiredState = 'expired_state';
    case InvalidSignature = 'invalid_signature';
    case InvalidAccount = 'invalid_account';
    case AccessDenied = 'access_denied';
    case MissingScopes = 'missing_scopes';
    case NotPermitted = 'not_permitted';
    case SessionRequired = 'session_required';
    case ChannelUnavailable = 'channel_unavailable';
    case PlanLimitReached = 'plan_limit_reached';
    case SandboxClaimRequired = 'sandbox_claim_required';
    case Unexpected = 'unexpected';
}
