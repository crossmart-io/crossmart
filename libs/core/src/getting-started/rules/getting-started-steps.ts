import type {
  AccountProgress,
  GettingStarted,
  GettingStartedStepView,
  StoreConnectLink,
} from '../entities/getting-started.js';
import { GettingStartedStepOwner } from '../enums/getting-started-step-owner.enum.js';
import { GettingStartedStepState } from '../enums/getting-started-step-state.enum.js';
import { GettingStartedStep } from '../enums/getting-started-step.enum.js';
import {
  CONNECT_CHANNEL_QUERY,
  CONNECTABLE_CHANNELS,
  GETTING_STARTED_STEP_COPY,
  GETTING_STARTED_STEP_ORDER,
  GETTING_STARTED_STEP_TOOLS,
  GETTING_STARTED_WEB_PATHS,
} from '../getting-started.constants.js';

/** A step's state and the app page it is taken on; null when the step does not apply. */
interface StepStatus {
  state: GettingStartedStepState;
  path: string | null;
}

const done = (isDone: boolean): GettingStartedStepState =>
  isDone ? GettingStartedStepState.Done : GettingStartedStepState.Todo;

/** Todo once `ready`, blocked before; done when `isDone`. */
function gated(isDone: boolean, ready: boolean): GettingStartedStepState {
  if (isDone) return GettingStartedStepState.Done;
  return ready ? GettingStartedStepState.Todo : GettingStartedStepState.Blocked;
}

const STEP_OWNERS: Readonly<Record<GettingStartedStep, GettingStartedStepOwner>> = {
  [GettingStartedStep.VerifyEmail]: GettingStartedStepOwner.Merchant,
  [GettingStartedStep.ClaimAccount]: GettingStartedStepOwner.Merchant,
  [GettingStartedStep.AddProducts]: GettingStartedStepOwner.Agent,
  [GettingStartedStep.ReviewProposals]: GettingStartedStepOwner.Merchant,
  [GettingStartedStep.ConnectStore]: GettingStartedStepOwner.Merchant,
  [GettingStartedStep.Publish]: GettingStartedStepOwner.Agent,
};

/**
 * Each step's status for the account. Claiming applies to an unclaimed sandbox only, and
 * replaces confirming the email; reviewing proposals applies while agents' changes need approval.
 */
const STEP_STATUS: Readonly<
  Record<GettingStartedStep, (progress: AccountProgress) => StepStatus | null>
> = {
  [GettingStartedStep.VerifyEmail]: ({ unclaimedSandbox, emailVerified }) =>
    unclaimedSandbox ? null : { state: done(emailVerified), path: null },
  [GettingStartedStep.ClaimAccount]: ({ unclaimedSandbox }) =>
    unclaimedSandbox ? { state: GettingStartedStepState.Todo, path: null } : null,
  [GettingStartedStep.AddProducts]: ({ products }) => ({
    state: done(products > 0),
    path: GETTING_STARTED_WEB_PATHS.products,
  }),
  [GettingStartedStep.ReviewProposals]: ({ agentChangesNeedApproval, pendingProposals }) =>
    agentChangesNeedApproval
      ? { state: done(pendingProposals === 0), path: GETTING_STARTED_WEB_PATHS.agentReview }
      : null,
  [GettingStartedStep.ConnectStore]: ({ connectedStores, unclaimedSandbox }) => ({
    state: gated(connectedStores > 0, !unclaimedSandbox),
    path: GETTING_STARTED_WEB_PATHS.stores,
  }),
  [GettingStartedStep.Publish]: ({ liveListings, connectedStores, products }) => ({
    state: gated(liveListings > 0, connectedStores > 0 && products > 0),
    path: null,
  }),
};

function toStepView(
  step: GettingStartedStep,
  status: StepStatus,
  webAppUrl: string,
): GettingStartedStepView {
  return {
    step,
    state: status.state,
    owner: STEP_OWNERS[step],
    ...GETTING_STARTED_STEP_COPY[step],
    url: status.path ? `${webAppUrl}${status.path}` : null,
    tools: GETTING_STARTED_STEP_TOOLS[step] ?? [],
  };
}

/** Links that open the Stores page with a channel's connect dialog. */
export function storeConnectLinks(webAppUrl: string): StoreConnectLink[] {
  return CONNECTABLE_CHANNELS.map((channel) => {
    const query = new URLSearchParams({ [CONNECT_CHANNEL_QUERY]: channel });
    return { channel, url: `${webAppUrl}${GETTING_STARTED_WEB_PATHS.stores}?${query}` };
  });
}

/** The steps that apply to the account, in order, with the first one still to take. */
export function gettingStarted(progress: AccountProgress, webAppUrl: string): GettingStarted {
  const steps = GETTING_STARTED_STEP_ORDER.flatMap((step) => {
    const status = STEP_STATUS[step](progress);
    return status ? [toStepView(step, status, webAppUrl)] : [];
  });
  const next = steps.find((view) => view.state === GettingStartedStepState.Todo);
  return {
    ...progress,
    nextStep: next?.step ?? null,
    steps,
    connectStoreLinks: storeConnectLinks(webAppUrl),
  };
}
