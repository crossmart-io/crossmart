import { Injectable } from '@nestjs/common';
import {
  ChannelCapability,
  ChannelConnectorRegistry,
  type PublishCandidate,
  supportsCapability,
  type UnmetPublishRequirement,
} from '@crossmart/connectors';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { DisplayedListing, ListingDisplay } from '../entities/listing-display.js';
import { listingDisplayOf } from '../rules/listing-display-state.js';

/** One product on one store, as its display state reads it. */
export interface ListingDisplaySubject {
  /** Whether the store's selection includes the product. */
  selected: boolean;
  /** Whether the merchant removed it from the store by hand. */
  removedByHand: boolean;
  listing: DisplayedListing | null;
  /** What the store's connector checks about the product before it is sent. */
  candidate: PublishCandidate;
}

/**
 * Turns a product's selection and listing on a store into the one state a merchant reads. It
 * asks the store's connector what the product lacks, from what Crossmart already has, so it
 * makes no queries: callers map whole pages through it.
 */
@Injectable()
export class ListingDisplayResolver {
  constructor(private readonly registry: ChannelConnectorRegistry) {}

  resolve(connection: ChannelConnectionView, subject: ListingDisplaySubject): ListingDisplay {
    const { candidate, ...input } = subject;
    return listingDisplayOf({
      ...input,
      blockers: [
        ...connection.publishReadiness.unmet,
        ...this.productBlockers(connection, candidate),
      ],
    });
  }

  private productBlockers(
    connection: ChannelConnectionView,
    candidate: PublishCandidate,
  ): UnmetPublishRequirement[] {
    const connector = this.registry.require(connection.channel);
    if (!supportsCapability(connector, ChannelCapability.PublishListings)) return [];
    return connector.unmetProductRequirements?.(candidate) ?? [];
  }
}
