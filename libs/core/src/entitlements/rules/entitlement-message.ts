import { FEATURE_NOUNS } from '../entitlements.constants.js';
import type { EntitlementCheck } from '../entities/entitlement-check.js';
import { EntitlementErrorCode } from '../enums/entitlement-error-code.enum.js';
import { FeatureKind } from '../enums/feature-kind.enum.js';

const pluralRules = new Intl.PluralRules('en');
const numberFormat = new Intl.NumberFormat('en');
const UPGRADE_TO_ADD = 'Upgrade the plan to add more.';
const UPGRADE_TO_USE = 'Upgrade the plan to use them.';

function isOne(count: number): boolean {
  return pluralRules.select(count) === 'one';
}

function counted(count: number, check: EntitlementCheck): string {
  const noun = FEATURE_NOUNS[check.feature];
  return `${numberFormat.format(count)} ${isOne(count) ? noun.one : noun.other.toLowerCase()}`;
}

/** Why a plan refuses a check, as a code clients can act on. */
export function entitlementErrorCode(check: EntitlementCheck): EntitlementErrorCode {
  return check.kind === FeatureKind.Flag
    ? EntitlementErrorCode.FeatureNotIncluded
    : EntitlementErrorCode.PlanLimitReached;
}

/**
 * A refusal people can act on: "The Free plan includes 2 connected channels, and 2 are in use.
 * Upgrade the plan to add more." Flags say they are not included.
 */
export function entitlementMessage(check: EntitlementCheck): string {
  const plan = `the ${check.plan.name} plan`;
  if (check.kind === FeatureKind.Flag) {
    return `${FEATURE_NOUNS[check.feature].other} are not included in ${plan}. ${UPGRADE_TO_USE}`;
  }
  const inUse = `${numberFormat.format(check.usage)} ${isOne(check.usage) ? 'is' : 'are'} in use`;
  const adding = isOne(check.requested)
    ? ''
    : ` Adding ${numberFormat.format(check.requested)} more would go past it.`;
  return `The ${check.plan.name} plan includes ${counted(check.limit ?? 0, check)}, and ${inUse}.${adding} ${UPGRADE_TO_ADD}`;
}
