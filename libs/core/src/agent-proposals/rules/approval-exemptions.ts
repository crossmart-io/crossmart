import { ProductStatus } from '@crossmart/database/generated/prisma/enums.js';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { AgentApprovalExemption } from '../enums/agent-approval-exemption.enum.js';

/** The input field that decides a new product's status. */
const PRODUCT_STATUS_INPUT = 'status';

/** Whether a call's input (a tool input, or the REST body it becomes) qualifies. */
type ExemptionRule = (input: unknown) => boolean;

/**
 * A new product that stays a draft: the status is left out (drafts are the default) or DRAFT.
 * Creating a product never lists it on a store, and only ACTIVE products are shown or sold, so a
 * draft changes nothing a buyer sees. Anything else, `null` included, waits for the seller.
 */
export function isNewDraft(input: unknown): boolean {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const status: unknown = (input as Record<string, unknown>)[PRODUCT_STATUS_INPUT];
  return status === undefined || status === ProductStatus.DRAFT;
}

const EXEMPTION_RULES: Readonly<Record<AgentApprovalExemption, ExemptionRule>> = {
  [AgentApprovalExemption.NewDraft]: isNewDraft,
};

/** Whether this input qualifies for the exemption. */
export function qualifiesFor(exemption: AgentApprovalExemption, input: unknown): boolean {
  return EXEMPTION_RULES[exemption](input);
}

/**
 * The exemption a tool call qualifies for while the workspace approves agents' changes; null
 * when it waits for the seller like any other write.
 */
export function approvalExemptionFor(
  spec: ApiToolSpec,
  input: unknown,
): AgentApprovalExemption | null {
  const exemption = spec.approvalExemptWhen;
  return exemption && qualifiesFor(exemption, input) ? exemption : null;
}
