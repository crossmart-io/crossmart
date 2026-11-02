import type { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import type { ActivityAction } from '../enums/activity-action.enum.js';
import type { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';

export interface ActivityActorView {
  type: ActivityActorType;
  userId: string | null;
  apiKeyId: string | null;
  /** The user's or key's name; null for system actions and for deleted users or keys. */
  name: string | null;
  /** Set for users only. */
  email: string | null;
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
  createdAt: Date;
}

export interface ActivityPage {
  items: ActivityEventView[];
  /** Pass as `cursor` to get older events; null on the last page. */
  nextCursor: string | null;
}

/** Newest first. Absent filters are not applied. */
export interface ActivityQuery {
  action?: ActivityAction;
  outcome?: ActivityOutcome;
  subjectType?: ActivitySubjectType;
  /** Events about this subject, including bulk events that touched it. */
  subjectId?: string;
  actorUserId?: string;
  actorApiKeyId?: string;
  cursor?: string;
  limit: number;
}
