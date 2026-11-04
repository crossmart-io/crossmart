import { findEnumValue } from '@crossmart/common';
import { ActivityOutcome, type Prisma } from '@crossmart/database';
import {
  ACTIVITY_FAILURE_REASON_MAX_LENGTH,
  ACTIVITY_LABEL_MAX_LENGTH,
  ACTIVITY_MAX_SUBJECT_IDS,
  ACTIVITY_SUMMARY_MAX_LENGTH,
  TRUNCATION_MARKER,
} from '../activity.constants.js';
import type { ActivityEntry } from '../entities/activity-entry.js';
import type { ActivityEventView, ActivitySubjectView } from '../entities/activity-event-view.js';
import type { Actor } from '../entities/actor.js';
import { ActivityAction } from '../enums/activity-action.enum.js';
import { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';
import type { ActivityEventRecord } from '../repositories/activity-event.queries.js';
import { summarizeActivity } from '../rules/activity-summary.js';

function truncate(text: string | undefined, maxLength: number): string | null {
  if (text === undefined) return null;
  return text.length > maxLength
    ? `${text.slice(0, maxLength - TRUNCATION_MARKER.length)}${TRUNCATION_MARKER}`
    : text;
}

/** The subject first, then the related ids, each once. */
function toSubjectIds(entry: ActivityEntry): string[] {
  const ids = [entry.subject?.id, ...(entry.relatedSubjectIds ?? [])].flatMap((id) =>
    id ? [id] : [],
  );
  return [...new Set(ids)].slice(0, ACTIVITY_MAX_SUBJECT_IDS);
}

export function toActivityEventInput(
  workspaceId: string,
  actor: Actor,
  entry: ActivityEntry,
): Prisma.ActivityEventUncheckedCreateInput {
  return {
    workspaceId,
    actorType: actor.type,
    actorUserId: actor.userId,
    actorApiKeyId: actor.apiKeyId,
    action: entry.action,
    outcome: entry.outcome ?? ActivityOutcome.SUCCEEDED,
    subjectType: entry.subject?.type ?? null,
    subjectId: entry.subject?.id ?? null,
    subjectLabel: truncate(entry.subject?.label, ACTIVITY_LABEL_MAX_LENGTH),
    subjectIds: toSubjectIds(entry),
    itemCount: entry.itemCount ?? null,
    failureReason: truncate(entry.failureReason, ACTIVITY_FAILURE_REASON_MAX_LENGTH),
    summary: truncate(summarizeActivity(entry), ACTIVITY_SUMMARY_MAX_LENGTH) ?? '',
  };
}

function toSubjectView(record: ActivityEventRecord): ActivitySubjectView | null {
  const type = findEnumValue(ActivitySubjectType, record.subjectType);
  return type ? { type, id: record.subjectId, label: record.subjectLabel } : null;
}

/** Null for an action this version does not know, such as one written by a newer release. */
export function toActivityEventView(record: ActivityEventRecord): ActivityEventView | null {
  const action = findEnumValue(ActivityAction, record.action);
  if (!action) return null;
  return {
    id: record.id,
    action,
    outcome: record.outcome,
    summary: record.summary,
    actor: {
      type: record.actorType,
      userId: record.actorUserId,
      apiKeyId: record.actorApiKeyId,
      name: record.actorUser?.name ?? record.actorApiKey?.name ?? null,
      email: record.actorUser?.email ?? null,
    },
    subject: toSubjectView(record),
    itemCount: record.itemCount,
    failureReason: record.failureReason,
    createdAt: record.createdAt,
  };
}
