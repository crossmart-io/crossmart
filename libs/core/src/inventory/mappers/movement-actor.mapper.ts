import type { Actor } from '../../activity/entities/actor.js';

/** The ledger columns that name who made a stock change. */
export interface MovementActorColumns {
  actorUserId: string | null;
  apiKeyId: string | null;
}

/** Credits a ledger entry to the same user or API key the activity log credits. */
export function toMovementActor(actor: Actor): MovementActorColumns {
  return { actorUserId: actor.userId, apiKeyId: actor.apiKeyId };
}
