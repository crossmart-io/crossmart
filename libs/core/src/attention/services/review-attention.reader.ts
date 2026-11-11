import { Injectable } from '@nestjs/common';
import { SuggestionStatus } from '@crossmart/database';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import { toProposalView } from '../../agent-proposals/mappers/agent-proposal.mapper.js';
import { AgentProposalRepository } from '../../agent-proposals/repositories/agent-proposal.repository.js';
import { proposalToolTitle } from '../../agent-proposals/rules/proposal-tools.js';
import { SuggestionsService } from '../../suggestions/services/suggestions.service.js';
import type {
  AttentionList,
  AttentionProposal,
  AttentionSuggestion,
} from '../entities/attention-summary.js';
import { toAttentionProposal, toAttentionSuggestion } from '../rules/attention.mappers.js';

const FIRST_PAGE = 1;

/**
 * Changes waiting for a person: outside agents' proposals and AI suggestions, read with the
 * same queries as the Agent proposals page and the Suggestions inbox.
 */
@Injectable()
export class ReviewAttentionReader {
  constructor(
    private readonly proposals: AgentProposalRepository,
    private readonly suggestions: SuggestionsService,
  ) {}

  async pendingProposals(
    workspaceId: string,
    limit: number,
  ): Promise<AttentionList<AttentionProposal>> {
    const now = new Date();
    const { records, total } = await this.proposals.list(
      workspaceId,
      { status: AgentProposalStatus.Pending, page: FIRST_PAGE, limit },
      now,
    );
    const items = records.map((record) =>
      toAttentionProposal(toProposalView(record, proposalToolTitle, now)),
    );
    return { count: total, items };
  }

  async pendingSuggestions(
    workspaceId: string,
    limit: number,
  ): Promise<AttentionList<AttentionSuggestion>> {
    const page = await this.suggestions.list(workspaceId, {
      status: SuggestionStatus.PENDING,
      limit,
    });
    return { count: page.total, items: page.items.map(toAttentionSuggestion) };
  }
}
