import { WorkspaceRole } from '@crossmart/database';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** How long an unclaimed sandbox account lives (ADR 0019). Stated in the claim emails. */
export const SANDBOX_TTL_DAYS = 14;
export const SANDBOX_TTL_MS = SANDBOX_TTL_DAYS * MS_PER_DAY;
/** The claim email is sent again once, this long after the first, if still unclaimed. */
export const SANDBOX_CLAIM_REMINDER_AFTER_MS = 3 * MS_PER_DAY;
export const SANDBOX_CLAIM_TOKEN_BYTES = 32;

/** The web app page a claim link opens, with the token in the query. */
export const SANDBOX_CLAIM_PATH = '/claim';
export const SANDBOX_CLAIM_TOKEN_QUERY = 'token';

/** The key the agent gets: catalog work only, never members, keys, stores or billing. */
export const SANDBOX_AGENT_KEY_NAME = 'AI agent (sandbox account)';
export const SANDBOX_AGENT_KEY_ROLE = WorkspaceRole.EDITOR;

/** Better Auth's provider id for an email and password login. */
export const CREDENTIAL_PROVIDER_ID = 'credential';
/** Separates the local part of an address from its domain. */
export const EMAIL_DOMAIN_SEPARATOR = '@';

export const INVALID_CLAIM_LINK = 'This claim link is invalid, used or expired';
export const PASSWORD_ALREADY_SET =
  'This account already has a password. Sign in with it, then claim the account.';
export const NOTHING_TO_CLAIM = 'This workspace has no sandbox account waiting for you to claim';

/** Sandboxes one sweep query handles, so no sweep holds a long transaction. */
export const SANDBOX_SWEEP_BATCH_SIZE = 50;
/** Batches one sweep runs at most; the next hourly sweep picks up the rest. */
export const SANDBOX_SWEEP_MAX_BATCHES = 20;
export const SANDBOX_SWEEP_INTERVAL_MS = MS_PER_HOUR;
export const SANDBOX_SWEEP_JOB_NAME = 'sandbox-sweep';
export const SANDBOX_SWEEP_SCHEDULER_ID = 'sandbox-sweep';
