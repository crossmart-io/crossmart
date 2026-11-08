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
  /** Who approved the outside agent's proposal that made the change (ADR 0028). */
  approvedByUserId?: string | null;
}

/** The built-in agent of ADR 0026, credited in the activity log as acting for its user. */
export const AGENT_WORKER_NAME = 'Crossmart Agent';

/** The name the built-in agent had before it was renamed; older events and jobs still carry it. */
export const LEGACY_AGENT_WORKER_NAME = 'Agent Worker';

/** The built-in agent's current name for a stored one, so older events read like new ones. */
export function builtInAgentName(stored: string | null): string | null {
  return stored === LEGACY_AGENT_WORKER_NAME ? AGENT_WORKER_NAME : stored;
}

/** Who an actor is, by type; ids that do not apply are null. */
interface ActorFields {
  type: ActivityActorType;
  userId?: string | null;
  apiKeyId?: string | null;
  agentClientId?: string | null;
  agentName?: string | null;
  approvedByUserId?: string | null;
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
  /**
   * The person who approved the change, when an outside agent proposed it and a person approved
   * it (ADR 0028): "Claude for Dana, approved by Lee".
   */
  readonly approvedByUserId: string | null;

  private constructor(fields: ActorFields) {
    this.type = fields.type;
    this.userId = fields.userId ?? null;
    this.apiKeyId = fields.apiKeyId ?? null;
    this.agentClientId = fields.agentClientId ?? null;
    this.agentName = fields.agentName ?? null;
    this.approvedByUserId = fields.approvedByUserId ?? null;
  }

  /** The same actor, credited with the person who approved its proposal. */
  approvedBy(userId: string): Actor {
    return new Actor({ ...this.toRef(), approvedByUserId: userId });
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
    const actor = Actor.baseFrom(ref);
    return ref.approvedByUserId && actor.type !== ActivityActorType.SYSTEM
      ? actor.approvedBy(ref.approvedByUserId)
      : actor;
  }

  private static baseFrom(ref: ActorRef): Actor {
    if (ref.type === ActivityActorType.USER && ref.userId) return Actor.user(ref.userId);
    if (ref.type === ActivityActorType.API_KEY && ref.apiKeyId) return Actor.apiKey(ref.apiKeyId);
    if (ref.type === ActivityActorType.AGENT && ref.userId) return Actor.agentFrom(ref, ref.userId);
    return Actor.system();
  }

  private static agentFrom(ref: ActorRef, userId: string): Actor {
    if (ref.agentClientId) return Actor.agent(userId, ref.agentClientId);
    return builtInAgentName(ref.agentName ?? null) === AGENT_WORKER_NAME
      ? Actor.agentWorker(userId)
      : Actor.system();
  }

  /** The actor as plain data, to put in a background job. */
  toRef(): ActorRef {
    return {
      type: this.type,
      userId: this.userId,
      apiKeyId: this.apiKeyId,
      agentClientId: this.agentClientId,
      agentName: this.agentName,
      ...(this.approvedByUserId ? { approvedByUserId: this.approvedByUserId } : {}),
    };
  }

  /** Background work that no person or key started, such as a scheduled sync. */
  static system(): Actor {
    return new Actor({ type: ActivityActorType.SYSTEM });
  }
}
