import type { ActorRef } from '../../activity/entities/actor.js';

/** A request to generate channel content for products, as the API takes it. */
export interface ContentGenerationRequest {
  workspaceId: string;
  connectionId: string;
  productIds: readonly string[];
}

/** One product on one connection, as the worker runs it. */
export interface ContentGenerationJob {
  workspaceId: string;
  connectionId: string;
  productId: string;
  /** Who asked, credited on the suggestions. */
  requestedBy: ActorRef;
}

/** What a request queued. */
export interface ContentGenerationReceipt {
  queued: number;
}
