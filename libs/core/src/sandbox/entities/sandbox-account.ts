import type { StartingSubscription } from '../../entitlements/entities/starting-subscription.js';
import type { SandboxClaimOutcome } from '../enums/sandbox-claim-outcome.enum.js';
import type { SandboxOpeningOutcome } from '../enums/sandbox-opening-outcome.enum.js';

/** What an agent gives to open a sandbox account: whose it is, and what to call the store. */
export interface SandboxRequest {
  email: string;
  storeName: string;
}

export type SandboxOpening =
  | {
      outcome: SandboxOpeningOutcome.Created;
      workspaceId: string;
      /** The agent's API key for the new workspace. Shown once, never stored in clear. */
      apiKey: string;
      claimExpiresAt: Date;
    }
  | { outcome: SandboxOpeningOutcome.SignInRequired };

/** The rows that make up a new sandbox account, written together. */
export interface NewSandboxAccount {
  email: string;
  ownerName: string;
  storeName: string;
  workspaceSlug: string;
  subscription: StartingSubscription;
  claimTokenHash: string;
  expiresAt: Date;
  agentKey: { name: string; prefix: string; hash: string };
}

export interface CreatedSandboxAccount {
  workspaceId: string;
  apiKeyId: string;
}

/** What the claim page shows before the person claims. */
export interface SandboxClaimPreview {
  workspaceId: string;
  email: string;
  storeName: string;
  claimExpiresAt: Date;
  /** True when the person already has a password: they sign in instead of choosing one. */
  passwordSet: boolean;
}

/** A sandbox account that has just become a normal one. */
export interface ClaimedSandbox {
  workspaceId: string;
  userId: string;
  email: string;
  storeName: string;
}

export type SandboxClaimResult =
  | { outcome: SandboxClaimOutcome.Claimed; claimed: ClaimedSandbox }
  | { outcome: SandboxClaimOutcome.InvalidLink | SandboxClaimOutcome.PasswordAlreadySet };

/** An unclaimed sandbox whose claim email is due again. */
export interface SandboxReminder {
  id: string;
  email: string;
  storeName: string;
  expiresAt: Date;
}

export interface SandboxSweepResult {
  reminded: number;
  deleted: number;
}
