import { SANDBOX_MAX_PRODUCTS } from '../entitlements.constants.js';
import type { SandboxRefusal } from '../entities/sandbox-refusal.js';
import { SandboxRestriction } from '../enums/sandbox-restriction.enum.js';

/** What the refused action is, as the end of "so it cannot …" and "then you can …". */
const RESTRICTED_ACTIONS: Readonly<Record<SandboxRestriction, string>> = {
  [SandboxRestriction.ConnectChannel]: 'connect a store',
  [SandboxRestriction.Publish]: 'publish listings',
  [SandboxRestriction.InviteMember]: 'invite members',
  [SandboxRestriction.CreateWorkspace]: 'add workspaces',
  [SandboxRestriction.GenerateContent]: 'generate content with Crossmart AI',
  [SandboxRestriction.AddProducts]: 'add more products',
  [SandboxRestriction.Subscribe]: 'start a paid subscription',
};

/** An ISO timestamp's date part: "2026-11-21". */
const ISO_DATE_LENGTH = 10;

function reason(refusal: SandboxRefusal): string {
  if (refusal.restriction === SandboxRestriction.AddProducts) {
    return (
      `This Crossmart account is an unclaimed sandbox, which holds at most ` +
      `${SANDBOX_MAX_PRODUCTS} products (${refusal.productCount ?? 0} now).`
    );
  }
  const action = RESTRICTED_ACTIONS[refusal.restriction];
  return `This Crossmart account is an unclaimed sandbox, so it cannot ${action}.`;
}

/**
 * A refusal an AI agent can act on: what the sandbox cannot do, and that the user must claim the
 * account from the emailed link first.
 */
export function sandboxRefusalMessage(refusal: SandboxRefusal): string {
  const until = refusal.claimExpiresAt.toISOString().slice(0, ISO_DATE_LENGTH);
  return (
    `${reason(refusal)} Ask the user to claim it with the link Crossmart emailed them (it works ` +
    `until ${until}). Once claimed, you can ${RESTRICTED_ACTIONS[refusal.restriction]}.`
  );
}
