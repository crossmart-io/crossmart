import { findEnumValue, requireEnumValue } from '@crossmart/common';
import { ChannelType, PublishRequirement } from '@crossmart/connectors';
import type { AgentProposalView } from '../../agent-proposals/entities/agent-proposal-views.js';
import type { SuggestionView } from '../../suggestions/entities/suggestion.js';
import type {
  AttentionListingGroup,
  AttentionProposal,
  AttentionSuggestion,
} from '../entities/attention-summary.js';
import type { FailedListingGroupRecord } from '../repositories/attention.queries.js';

export function toListingGroup(group: FailedListingGroupRecord): AttentionListingGroup {
  const { latest } = group;
  return {
    productId: group.productId,
    productTitle: latest.product.title,
    imageUrl: latest.product.media[0]?.url ?? null,
    connectionId: group.connectionId,
    channel: requireEnumValue(ChannelType, latest.connection.channel),
    storeName: latest.connection.displayName,
    failedListings: group.failedListings,
    lastError: latest.lastError,
    missingRequirement: findEnumValue(PublishRequirement, latest.missingRequirement) ?? null,
    updatedAt: latest.updatedAt,
  };
}

export function toAttentionProposal(view: AgentProposalView): AttentionProposal {
  return {
    id: view.id,
    agentName: view.agentName,
    toolName: view.toolName,
    toolTitle: view.toolTitle,
    summary: view.summary,
    createdAt: view.createdAt,
    expiresAt: view.expiresAt,
  };
}

export function toAttentionSuggestion(view: SuggestionView): AttentionSuggestion {
  return {
    id: view.id,
    productId: view.productId,
    productTitle: view.productTitle,
    kind: view.kind,
    connectionId: view.connection?.id ?? null,
    storeName: view.connection?.displayName ?? null,
    createdAt: view.createdAt,
  };
}
