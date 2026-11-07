<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AgentWorkerErrorCode: string
{
    case CreditsExhausted = 'credits_exhausted';
    case AiUnavailable = 'ai_unavailable';
    case SandboxClaimRequired = 'sandbox_claim_required';
    case AnswerUnusable = 'answer_unusable';
    case Internal = 'internal';
}
