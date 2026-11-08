import { ActivityActorType } from '@crossmart/database';

/** An actor as plain data, as background jobs carry it. */
export interface ActorRef {
  type: ActivityActorType;
  userId: string | null;
  apiKeyId: string | null;
  /** The connected agent's OAuth client id; absent in references made before agents existed. */
  agentClientId?: string | null;
  /** The name of a built-in agent such as Agent Worker, which has no OAuth client. */
  agentName?: string | null;
}

/** The built-in agent of ADR 0026, credited in the activity log as acting for its user. */
export const AGENT_WORKER_NAME = 'Agent Worker';

/** Who an actor is, by type; ids that do not apply are null. */
interface ActorFields {
  type: ActivityActorType;
  userId?: string | null;
  apiKeyId?: string | null;
  agentClientId?: string | null;
  agentName?: string | null;
}

/**
 * Who performed an action: a signed-in user, an API key, an AI agent acting for a user (a
 * connected one, or the built-in Agent Worker), or Crossmart itself.
 */
export class Actor {
  readonly type: ActivityActorType;
  readonly userId: string | null;
  readonly apiKeyId: string | null;
  /** The connected agent's OAuth client id. */
  readonly agentClientId: string | null;
  /** The built-in agent's name; connected agents are named by their OAuth client. */
  readonly agentName: string | null;

  private constructor(fields: ActorFields) {
    this.type = fields.type;
    this.userId = fields.userId ?? null;
    this.apiKeyId = fields.apiKeyId ?? null;
    this.agentClientId = fields.agentClientId ?? null;
    this.agentName = fields.agentName ?? null;
  }

  static user(userId: string): Actor {
    return new Actor({ type: ActivityActorType.USER, userId });
  }

  static apiKey(apiKeyId: string): Actor {
    return new Actor({ type: ActivityActorType.API_KEY, apiKeyId });
  }

  /** An agent connected with OAuth (`agentClientId`), acting for the user who connected it. */
  static agent(userId: string, agentClientId: string): Actor {
    return new Actor({ type: ActivityActorType.AGENT, userId, agentClientId });
  }

  /** Agent Worker (ADR 0026) acting for the person who chats with it and approved the change. */
  static agentWorker(userId: string): Actor {
    return new Actor({ type: ActivityActorType.AGENT, userId, agentName: AGENT_WORKER_NAME });
  }

  /**
   * An actor carried through a background job as plain data, such as who asked for an AI job.
   * Ids that do not fit the type are dropped.
   */
  static from(ref: ActorRef): Actor {
    if (ref.type === ActivityActorType.USER && ref.userId) return Actor.user(ref.userId);
    if (ref.type === ActivityActorType.API_KEY && ref.apiKeyId) return Actor.apiKey(ref.apiKeyId);
    if (ref.type === ActivityActorType.AGENT && ref.userId) return Actor.agentFrom(ref, ref.userId);
    return Actor.system();
  }

  private static agentFrom(ref: ActorRef, userId: string): Actor {
    if (ref.agentClientId) return Actor.agent(userId, ref.agentClientId);
    return ref.agentName === AGENT_WORKER_NAME ? Actor.agentWorker(userId) : Actor.system();
  }

  /** The actor as plain data, to put in a background job. */
  toRef(): ActorRef {
    return {
      type: this.type,
      userId: this.userId,
      apiKeyId: this.apiKeyId,
      agentClientId: this.agentClientId,
      agentName: this.agentName,
    };
  }

  /** Background work that no person or key started, such as a scheduled sync. */
  static system(): Actor {
    return new Actor({ type: ActivityActorType.SYSTEM });
  }
}
