import { ActivityActorType } from '@crossmart/database';

/** An actor as plain data, as background jobs carry it. */
export interface ActorRef {
  type: ActivityActorType;
  userId: string | null;
  apiKeyId: string | null;
}

/** Who performed an action: a signed-in user, an API key, or Crossmart itself. */
export class Actor {
  private constructor(
    readonly type: ActivityActorType,
    readonly userId: string | null,
    readonly apiKeyId: string | null,
  ) {}

  static user(userId: string): Actor {
    return new Actor(ActivityActorType.USER, userId, null);
  }

  static apiKey(apiKeyId: string): Actor {
    return new Actor(ActivityActorType.API_KEY, null, apiKeyId);
  }

  /**
   * An actor carried through a background job as plain data, such as who asked for an AI job.
   * Ids that do not fit the type are dropped.
   */
  static from(ref: ActorRef): Actor {
    if (ref.type === ActivityActorType.USER && ref.userId) return Actor.user(ref.userId);
    if (ref.type === ActivityActorType.API_KEY && ref.apiKeyId) return Actor.apiKey(ref.apiKeyId);
    return Actor.system();
  }

  /** The actor as plain data, to put in a background job. */
  toRef(): ActorRef {
    return { type: this.type, userId: this.userId, apiKeyId: this.apiKeyId };
  }

  /** Background work that no person or key started, such as a scheduled sync. */
  static system(): Actor {
    return new Actor(ActivityActorType.SYSTEM, null, null);
  }
}
