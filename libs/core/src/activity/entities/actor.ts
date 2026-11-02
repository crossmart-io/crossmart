import { ActivityActorType } from '@crossmart/database';

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

  /** Background work that no person or key started, such as a scheduled sync. */
  static system(): Actor {
    return new Actor(ActivityActorType.SYSTEM, null, null);
  }
}
