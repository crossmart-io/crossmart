<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum EntitlementErrorCode: string
{
    case PlanLimitReached = 'plan_limit_reached';
    case PlanFeatureNotIncluded = 'plan_feature_not_included';
    case SandboxClaimRequired = 'sandbox_claim_required';
}
