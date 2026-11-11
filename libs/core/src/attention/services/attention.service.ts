import { Injectable } from '@nestjs/common';
import type { AttentionQuery, AttentionSummary } from '../entities/attention-summary.js';
import { AttentionSection } from '../enums/attention-section.enum.js';
import { ListingAttentionReader } from './listing-attention.reader.js';
import { ReviewAttentionReader } from './review-attention.reader.js';
import { StoreAttentionReader } from './store-attention.reader.js';

/** A section's read, or null without reading when the reader may not see it. */
function ifShown<TSection>(
  query: AttentionQuery,
  section: AttentionSection,
  read: () => Promise<TSection>,
): Promise<TSection | null> {
  return query.sections.has(section) ? read() : Promise.resolve(null);
}

/**
 * What needs the merchant now, in one read for Home and the sidebar badge. Every count comes
 * from the same query as the page it links to (Channels, Agent proposals, Suggestions), so the
 * numbers always agree; each section is read only when the reader may see it.
 */
@Injectable()
export class AttentionService {
  constructor(
    private readonly stores: StoreAttentionReader,
    private readonly listings: ListingAttentionReader,
    private readonly reviews: ReviewAttentionReader,
  ) {}

  async summary(workspaceId: string, query: AttentionQuery): Promise<AttentionSummary> {
    const { limit } = query;
    const [stores, listings, proposals, suggestions] = await Promise.all([
      ifShown(query, AttentionSection.Stores, () => this.stores.read(workspaceId, limit)),
      ifShown(query, AttentionSection.Listings, () => this.listings.read(workspaceId, limit)),
      ifShown(query, AttentionSection.Proposals, () =>
        this.reviews.pendingProposals(workspaceId, limit),
      ),
      ifShown(query, AttentionSection.Suggestions, () =>
        this.reviews.pendingSuggestions(workspaceId, limit),
      ),
    ]);
    const total = [stores, listings, proposals, suggestions].reduce(
      (sum, section) => sum + (section?.count ?? 0),
      0,
    );
    return { total, stores, listings, proposals, suggestions };
  }
}
