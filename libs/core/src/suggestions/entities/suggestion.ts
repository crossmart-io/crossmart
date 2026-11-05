import type { ChannelType } from '@crossmart/connectors';
import type { SuggestionCreatorType, SuggestionStatus } from '@crossmart/database';
import type { SuggestionAgent } from '../enums/suggestion-agent.enum.js';
import type { SuggestionKind } from '../enums/suggestion-kind.enum.js';

/** A suggestion to store. The current value is what it replaces, read when it is made. */
export interface NewSuggestion {
  workspaceId: string;
  productId: string;
  connectionId: string | null;
  kind: SuggestionKind;
  currentValue: string;
  proposedValue: string;
  rationale: string;
  createdByType: SuggestionCreatorType;
  agent: SuggestionAgent | null;
  requestedByUserId: string | null;
  requestedByApiKeyId: string | null;
}

/** One suggestion in a workspace. */
export interface SuggestionRef {
  workspaceId: string;
  suggestionId: string;
}

export interface SuggestionConnectionView {
  id: string;
  channel: ChannelType;
  displayName: string;
}

/** Who made a suggestion: an agent on someone's request, or that user or key itself. */
export interface SuggestionCreatorView {
  type: SuggestionCreatorType;
  agent: SuggestionAgent | null;
  /** The user or API key that asked for it; null once deleted. */
  userId: string | null;
  apiKeyId: string | null;
  /** The user's or key's name. */
  name: string | null;
}

export interface SuggestionReviewView {
  userId: string | null;
  apiKeyId: string | null;
  name: string | null;
  reviewedAt: Date;
}

/** A suggestion as the inbox shows it: the change, its target and its review. */
export interface SuggestionView {
  id: string;
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  connection: SuggestionConnectionView | null;
  kind: SuggestionKind;
  status: SuggestionStatus;
  currentValue: string;
  proposedValue: string;
  rationale: string;
  createdBy: SuggestionCreatorView;
  review: SuggestionReviewView | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestionPage {
  items: SuggestionView[];
  nextCursor: string | null;
  total: number;
}

/** Newest first. Absent filters are not applied. */
export interface SuggestionQuery {
  status?: SuggestionStatus;
  productId?: string;
  connectionId?: string;
  kind?: SuggestionKind;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}

/** What a bulk approval did: each suggestion it reviewed, and the ids it could not. */
export interface BulkReviewResult {
  items: SuggestionView[];
  /** Ids not found in the workspace or no longer pending. */
  skippedIds: string[];
}
