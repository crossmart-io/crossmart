import { z } from 'zod';
import { AgentToolName, EmptyResultReason } from '../agent-tools.constants.js';

/**
 * What an agent reads next to an answer that shows an empty account, so a first call that finds
 * nothing still says what to do. It travels apart from the answer, which stays as the API gave it.
 */
export interface NextStepHint {
  reason: EmptyResultReason;
  message: string;
  /** The tools to call next. */
  tools: string[];
}

/** When an answer shows an empty account, and the hint to give then. */
export interface EmptyResultCheck {
  isEmpty: (value: unknown, input: Record<string, unknown>) => boolean;
  next: NextStepHint;
}

/** A page of the whole catalog (no search or filter) that holds nothing. */
const EMPTY_PAGE = z.object({ total: z.literal(0) });
const NO_ITEMS = z.array(z.unknown()).length(0);

/** Inputs that narrow a list, so an empty answer says nothing about the account. */
const FILTER_INPUTS = ['search', 'status'] as const;

function isUnfiltered(input: Record<string, unknown>): boolean {
  return FILTER_INPUTS.every((name) => input[name] === undefined);
}

export const EMPTY_CATALOG: EmptyResultCheck = {
  isEmpty: (value, input) => isUnfiltered(input) && EMPTY_PAGE.safeParse(value).success,
  next: {
    reason: EmptyResultReason.NoProducts,
    message:
      'The catalog is empty. You can add products now, before any store is connected: ask ' +
      `the seller what they sell and call ${AgentToolName.CreateProduct}. ` +
      `${AgentToolName.GetStarted} lists every next step, with links for the seller.`,
    tools: [AgentToolName.CreateProduct, AgentToolName.GetStarted],
  },
};

export const NO_STORES: EmptyResultCheck = {
  isEmpty: (value) => NO_ITEMS.safeParse(value).success,
  next: {
    reason: EmptyResultReason.NoStores,
    message:
      'No store is connected yet. Only the seller can connect one, in the Crossmart app: ' +
      `${AgentToolName.GetStarted} gives the links to send them. Meanwhile you can add ` +
      `products with ${AgentToolName.CreateProduct}; publishing needs a connected store.`,
    tools: [AgentToolName.GetStarted, AgentToolName.CreateProduct],
  },
};
