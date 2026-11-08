import type { Prisma } from '@crossmart/database';

/** Names shown with a proposal come in the same query, never one query per row. */
export const AGENT_PROPOSAL_INCLUDE = {
  user: { select: { name: true } },
  decidedBy: { select: { name: true } },
} satisfies Prisma.AgentProposalInclude;

export type AgentProposalRecord = Prisma.AgentProposalGetPayload<{
  include: typeof AGENT_PROPOSAL_INCLUDE;
}>;

/** What a new proposal stores. */
export type NewAgentProposal = Omit<
  Prisma.AgentProposalUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

/** How a proposal ended once it ran. */
export interface AgentProposalOutcomeRecord {
  status: string;
  result: string;
  resultIsError: boolean;
}
