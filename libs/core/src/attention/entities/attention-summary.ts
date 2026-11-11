import type { ChannelType, PublishRequirement } from '@crossmart/connectors';
import type { ChannelConnectionStatus } from '@crossmart/database';
import type { AttentionSection } from '../enums/attention-section.enum.js';
import type { AttentionStoreReason } from '../enums/attention-store-reason.enum.js';
import type { SuggestionKind } from '../../suggestions/enums/suggestion-kind.enum.js';

/** One part of the summary: how many need attention in all, and the latest few. */
export interface AttentionList<TItem> {
  count: number;
  items: TItem[];
}

export interface AttentionStore {
  connectionId: string;
  channel: ChannelType;
  displayName: string;
  status: ChannelConnectionStatus;
  statusReason: string | null;
  reason: AttentionStoreReason;
  /** Listings still on the channel (not delisted). */
  liveListings: number;
}

/** A product's failed listings on one store, with the latest refusal. */
export interface AttentionListingGroup {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  connectionId: string;
  channel: ChannelType;
  storeName: string;
  /** Failed listings of the product on the store (eBay variations can make several). */
  failedListings: number;
  lastError: string | null;
  /** What the channel asks for, when the refusal is missing details rather than an error. */
  missingRequirement: PublishRequirement | null;
  updatedAt: Date;
}

export interface AttentionProposal {
  id: string;
  agentName: string;
  toolName: string;
  toolTitle: string;
  summary: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AttentionSuggestion {
  id: string;
  productId: string;
  productTitle: string;
  kind: SuggestionKind;
  connectionId: string | null;
  storeName: string | null;
  createdAt: Date;
}

/**
 * What needs the merchant now, for Home and the sidebar badge. A section the reader may not see
 * is null and adds nothing to `total`.
 */
export interface AttentionSummary {
  /** Everything counted below, for one badge. */
  total: number;
  /** Stores to reconnect or fix, and disconnected stores that still have live listings. */
  stores: AttentionList<AttentionStore> | null;
  /** `count` is failed listings, as on the Channels page; items group them by product and store. */
  listings: AttentionList<AttentionListingGroup> | null;
  /** Outside agents' changes waiting for approval. */
  proposals: AttentionList<AttentionProposal> | null;
  /** AI suggestions waiting for review. */
  suggestions: AttentionList<AttentionSuggestion> | null;
}

/** Whose summary it is: the sections they may see, and how many items each lists. */
export interface AttentionQuery {
  sections: ReadonlySet<AttentionSection>;
  limit: number;
}
