import type { UnmetPublishRequirement } from '@crossmart/connectors';

/** Whether a store can publish listings, and what its setup lacks when it cannot. */
export interface PublishReadiness {
  ready: boolean;
  /** What to finish first, in the order the merchant should do it; empty when ready. */
  unmet: UnmetPublishRequirement[];
}
