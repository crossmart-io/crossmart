export const PLANS_TAG = 'Plans';
/** An organization's plan and usage; billing will attach here. */
export const ORGANIZATION_SUBSCRIPTION_ROUTE = 'organizations/:organizationId/subscription';
/** Names the generated web client uses for the enums of this module. */
export const FEATURE_SCHEMA_NAME = 'Feature';
export const FEATURE_KIND_SCHEMA_NAME = 'FeatureKind';
export const SUBSCRIPTION_STATUS_SCHEMA_NAME = 'SubscriptionStatus';
export const ENTITLEMENT_ERROR_CODE_SCHEMA_NAME = 'EntitlementErrorCode';
export const SUBSCRIPTION_ACCESS_STATE_SCHEMA_NAME = 'SubscriptionAccessState';
export const PLAN_LIMIT_RESPONSE_DESCRIPTION =
  'The organization’s plan does not allow this (`ENTITLEMENTS_ENFORCED` is on). `code` and ' +
  '`feature` say why; upgrading the plan resolves it. Where billing is on, `code: ' +
  'subscription_inactive` means the organization is read-only until a billing admin fixes ' +
  'its subscription (`state` says why).';
export const SANDBOX_RESTRICTION_SCHEMA_NAME = 'SandboxRestriction';
export const SANDBOX_RESTRICTED_RESPONSE_DESCRIPTION =
  'Missing permission, or (with `code: sandbox_claim_required`) the workspace is an unclaimed ' +
  'sandbox account an AI agent opened: the user must claim it from the emailed link first.';
