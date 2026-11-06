import type { ChannelSettings } from '../channel-settings.js';
import type { PublishRequirement } from './publish-requirement.enum.js';

/** A requirement publishing does not meet yet, with what the merchant should do about it. */
export interface UnmetPublishRequirement {
  requirement: PublishRequirement;
  /** Short and merchant-readable: "Choose a shipping policy in this eBay connection’s …". */
  reason: string;
}

/** What a channel checks about a product before it is sent, without calling the channel. */
export interface PublishCandidate {
  /** The product's image URLs, in order. */
  imageUrls: readonly string[];
}

/**
 * Optional checks a `ListingPublisher` offers so Crossmart can say what blocks publishing before
 * a publish fails. They read only what Crossmart already stores, never the channel.
 */
export interface PublishPrerequisites {
  /** What the connection's account settings lack for any listing to be published. */
  unmetAccountRequirements?(settings: ChannelSettings | null): UnmetPublishRequirement[];
  /** What this product lacks to be published on the channel. */
  unmetProductRequirements?(candidate: PublishCandidate): UnmetPublishRequirement[];
}
