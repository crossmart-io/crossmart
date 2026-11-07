import { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';

/** A read-only state, as "the subscription is …" and what a billing admin does about it. */
interface InactiveReason {
  standing: string;
  fix: string;
}

const CHOOSE_A_PLAN = 'choose a plan';

const INACTIVE_REASONS: Readonly<Partial<Record<SubscriptionAccessState, InactiveReason>>> = {
  [SubscriptionAccessState.SubscriptionRequired]: { standing: 'not started', fix: CHOOSE_A_PLAN },
  [SubscriptionAccessState.PastDue]: {
    standing: 'past due',
    fix: 'update the payment method',
  },
  [SubscriptionAccessState.Canceled]: { standing: 'canceled', fix: CHOOSE_A_PLAN },
  [SubscriptionAccessState.Unpaid]: { standing: 'unpaid', fix: 'pay the open invoice' },
  [SubscriptionAccessState.Paused]: { standing: 'paused', fix: 'add a payment method' },
};

const INACTIVE_FALLBACK: InactiveReason = { standing: 'inactive', fix: CHOOSE_A_PLAN };

/**
 * A refusal people and AI agents can act on: why the organization is read-only, that reading
 * still works, and that a billing admin fixes it in Settings, Billing.
 */
export function subscriptionInactiveMessage(state: SubscriptionAccessState): string {
  const { standing, fix } = INACTIVE_REASONS[state] ?? INACTIVE_FALLBACK;
  return (
    `This organization's Crossmart subscription is ${standing}, so the account is read-only: ` +
    'data can be read, but not changed, published or synced. Ask an owner or admin of the ' +
    `organization to ${fix} in Settings > Billing.`
  );
}
