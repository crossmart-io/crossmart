import type { ChannelType } from '@crossmart/connectors';
import type { GettingStartedStepOwner } from '../enums/getting-started-step-owner.enum.js';
import type { GettingStartedStepState } from '../enums/getting-started-step-state.enum.js';
import type { GettingStartedStep } from '../enums/getting-started-step.enum.js';

/** What the account has done so far, as read from the database. */
export interface AccountProgress {
  /** Whether the person behind the call confirmed their email address. */
  emailVerified: boolean;
  /** True for an account an AI agent opened that nobody has claimed yet (ADR 0019). */
  unclaimedSandbox: boolean;
  products: number;
  /** Stores that are not disconnected, including ones to reconnect. */
  connectedStores: number;
  /** Listings live on a store. */
  liveListings: number;
  /** Outside agents' changes waiting for the seller (ADR 0028). */
  pendingProposals: number;
  /** Whether outside agents' changes wait for the seller's approval here. */
  agentChangesNeedApproval: boolean;
}

/** One step, with who takes it and how. */
export interface GettingStartedStepView {
  step: GettingStartedStep;
  state: GettingStartedStepState;
  owner: GettingStartedStepOwner;
  title: string;
  detail: string;
  /** The page of the Crossmart app where the seller takes it, if there is one. */
  url: string | null;
  /** The tools an agent takes it with; empty for a seller's step. */
  tools: string[];
}

/** A link that opens the Stores page with one channel's connect dialog. */
export interface StoreConnectLink {
  channel: ChannelType;
  url: string;
}

/** Where a new account stands, and what to do next. */
export interface GettingStarted extends AccountProgress {
  /** The first step still to take, or null once every step is done. */
  nextStep: GettingStartedStep | null;
  steps: GettingStartedStepView[];
  connectStoreLinks: StoreConnectLink[];
}
