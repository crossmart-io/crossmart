<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum SubscriptionAccessState: string
{
    case Unrestricted = 'unrestricted';
    case Sandbox = 'sandbox';
    case Trialing = 'trialing';
    case Active = 'active';
    case PastDueGrace = 'past_due_grace';
    case Legacy = 'legacy';
    case SubscriptionRequired = 'subscription_required';
    case PastDue = 'past_due';
    case Canceled = 'canceled';
    case Unpaid = 'unpaid';
    case Paused = 'paused';
}
