import { ChannelType } from '@crossmart/connectors';
import { AgentToolName } from '../agent-tools/agent-tools.constants.js';
import { SANDBOX_TTL_DAYS } from '../sandbox/sandbox.constants.js';
import { GettingStartedStep } from './enums/getting-started-step.enum.js';

/** Pages of the web app the steps link to, under `WEB_APP_URL`. */
export const GETTING_STARTED_WEB_PATHS = {
  products: '/products',
  stores: '/stores',
  agentReview: '/agent/review',
} as const;

/** On the Stores page: the channel whose connect dialog opens at once (`?connect=shopify`). */
export const CONNECT_CHANNEL_QUERY = 'connect';

/** The channels a seller can connect a store on in the app today, in the order they are offered. */
export const CONNECTABLE_CHANNELS: readonly ChannelType[] = [ChannelType.Shopify, ChannelType.Ebay];

/**
 * The order the steps are listed in; the first one still to take is the next step. Proposals
 * come before more products: changes waiting for the seller are settled before more are made.
 */
export const GETTING_STARTED_STEP_ORDER: readonly GettingStartedStep[] = [
  GettingStartedStep.ClaimAccount,
  GettingStartedStep.ReviewProposals,
  GettingStartedStep.AddProducts,
  GettingStartedStep.ConnectStore,
  GettingStartedStep.Publish,
  GettingStartedStep.VerifyEmail,
];

/** The tools an agent takes its steps with. */
export const GETTING_STARTED_STEP_TOOLS: Readonly<Partial<Record<GettingStartedStep, string[]>>> = {
  [GettingStartedStep.AddProducts]: [AgentToolName.CreateProduct],
  [GettingStartedStep.Publish]: [AgentToolName.ListStores, AgentToolName.AddProductToStore],
};

interface StepCopy {
  title: string;
  detail: string;
}

/** What each step asks for, written for the agent that relays it to the seller. */
export const GETTING_STARTED_STEP_COPY: Readonly<Record<GettingStartedStep, StepCopy>> = {
  [GettingStartedStep.VerifyEmail]: {
    title: 'Confirm your email',
    detail:
      'The seller confirms the address they signed up with, from the email Crossmart sent ' +
      'them, so they can recover the account.',
  },
  [GettingStartedStep.ClaimAccount]: {
    title: 'Claim the account',
    detail:
      'The seller opens the claim link Crossmart emailed them. Until then, connecting stores, ' +
      `publishing and Crossmart AI are refused, and the account is deleted after ${SANDBOX_TTL_DAYS} days.`,
  },
  [GettingStartedStep.AddProducts]: {
    title: 'Add products',
    detail:
      'No store is needed for this. Ask the seller what they sell (title, condition, price, ' +
      `quantity, photo URLs) and create each item with ${AgentToolName.CreateProduct}. New ` +
      'products are drafts, created at once without the seller’s approval; making one active ' +
      'or publishing it waits for approval. Once a store is connected, the seller can also ' +
      'import its products.',
  },
  [GettingStartedStep.ReviewProposals]: {
    title: 'Approve the agent’s changes',
    detail:
      'Changes made by agents, except new drafts, wait for the seller’s approval under Agent ' +
      'proposals. Ask the ' +
      'seller to review them; they can also let agents apply changes directly in Settings > ' +
      `General. Check one with ${AgentToolName.GetProposal}.`,
  },
  [GettingStartedStep.ConnectStore]: {
    title: 'Connect a store',
    detail:
      'Only the seller can connect a store: they sign in to the channel in their browser. ' +
      'Send them a link from connectStoreLinks.',
  },
  [GettingStartedStep.Publish]: {
    title: 'Publish a product',
    detail:
      `List a product on a connected store with ${AgentToolName.AddProductToStore} (store ids ` +
      `come from ${AgentToolName.ListStores}). It needs a product and a connected store first.`,
  },
};
