import type { SortDirection } from '@crossmart/common';
import type { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import type { ActivityAction } from '../enums/activity-action.enum.js';
import type { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';

export interface ActivityActorView {
  type: ActivityActorType;
  userId: string | null;
  apiKeyId: string | null;
  /** The connected agent's OAuth client id, for agent actions. */
  agentClientId: string | null;
  /**
   * The user's or key's name; for an agent, the user it acted for. Null for system actions and
   * for deleted users or keys.
   */
  name: string | null;
  /** Set for users, and for the user an agent acted for. */
  email: string | null;
  /** The agent's name (such as "Claude"), for agent actions. */
  agentName: string | null;
}

export interface ActivitySubjectView {
  type: ActivitySubjectType;
  id: string | null;
  label: string | null;
}

export interface ActivityEventView {
  id: string;
  action: ActivityAction;
  outcome: ActivityOutcome;
  summary: string;
  actor: ActivityActorView;
  subject: ActivitySubjectView | null;
  itemCount: number | null;
  failureReason: string | null;
  /** The store it happened on, when it happened on one. */
  connectionId: string | null;
  createdAt: Date;
}

export interface ActivityPage {
  items: ActivityEventView[];
  /** Pass as `cursor` to get older events; null on the last page. */
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}

/** Newest first unless `direction` says otherwise. Absent filters are not applied. */
export interface ActivityQuery {
  /** By time; newest first by default. */
  direction?: SortDirection;
  action?: ActivityAction;
  outcome?: ActivityOutcome;
  subjectType?: ActivitySubjectType;
  /** Events about this subject, including bulk events that touched it. */
  subjectId?: string;
  actorUserId?: string;
  actorApiKeyId?: string;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}
