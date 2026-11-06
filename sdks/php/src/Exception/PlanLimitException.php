<?php

declare(strict_types=1);

namespace Crossmart\Exception;

/**
 * 402: the organization's plan does not allow the action. Upgrading the plan resolves it.
 */
final class PlanLimitException extends ApiException
{
    private const FEATURE_FIELD = 'feature';
    private const PLAN_FIELD = 'plan';
    private const LIMIT_FIELD = 'limit';
    private const USAGE_FIELD = 'usage';

    /** The plan feature that ran out, such as `active_listings` ({@see \Crossmart\Enum\Feature}). */
    public function getFeature(): ?string
    {
        return $this->bodyString(self::FEATURE_FIELD);
    }

    /** The code of the organization's plan, such as `starter`. */
    public function getPlan(): ?string
    {
        return $this->bodyString(self::PLAN_FIELD);
    }

    /** The plan's limit for the feature. Null means unlimited or not reported. */
    public function getLimit(): ?int
    {
        return $this->bodyInt(self::LIMIT_FIELD);
    }

    /** How much of the feature the organization uses now. */
    public function getUsage(): ?int
    {
        return $this->bodyInt(self::USAGE_FIELD);
    }
}
