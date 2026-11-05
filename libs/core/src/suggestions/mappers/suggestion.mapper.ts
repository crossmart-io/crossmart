import { findEnumValue } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import type {
  SuggestionConnectionView,
  SuggestionCreatorView,
  SuggestionReviewView,
  SuggestionView,
} from '../entities/suggestion.js';
import { SuggestionAgent } from '../enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRecord } from '../repositories/suggestion.queries.js';

function toConnection(record: SuggestionRecord): SuggestionConnectionView | null {
  const channel = findEnumValue(ChannelType, record.connection?.channel);
  if (!record.connection || !channel) return null;
  return { id: record.connection.id, channel, displayName: record.connection.displayName };
}

function toCreator(record: SuggestionRecord): SuggestionCreatorView {
  return {
    type: record.createdByType,
    agent: findEnumValue(SuggestionAgent, record.agent) ?? null,
    userId: record.requestedByUserId,
    apiKeyId: record.requestedByApiKeyId,
    name: record.requestedByUser?.name ?? record.requestedByApiKey?.name ?? null,
  };
}

function toReview(record: SuggestionRecord): SuggestionReviewView | null {
  if (!record.reviewedAt) return null;
  return {
    userId: record.reviewedByUserId,
    apiKeyId: record.reviewedByApiKeyId,
    name: record.reviewedByUser?.name ?? record.reviewedByApiKey?.name ?? null,
    reviewedAt: record.reviewedAt,
  };
}

/** The inbox view of a stored suggestion, or null for a kind this version does not know. */
export function toSuggestionView(record: SuggestionRecord): SuggestionView | null {
  const kind = findEnumValue(SuggestionKind, record.kind);
  if (!kind) return null;
  return {
    id: record.id,
    productId: record.productId,
    productTitle: record.product.title,
    imageUrl: record.product.media[0]?.url ?? null,
    connection: toConnection(record),
    kind,
    status: record.status,
    currentValue: record.currentValue,
    proposedValue: record.proposedValue,
    rationale: record.rationale,
    createdBy: toCreator(record),
    review: toReview(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
