import type { ActivityOutcome } from '@crossmart/database';
import type { ActivityAction } from '../enums/activity-action.enum.js';
import type { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';

export interface ActivitySubject {
  type: ActivitySubjectType;
  id?: string;
  /** The subject's name now, kept so the event still reads well after it is renamed or deleted. */
  label?: string;
}

/** What a service reports after a write. The recorder adds who, when and the summary. */
export interface ActivityEntry {
  action: ActivityAction;
  /** Defaults to succeeded. */
  outcome?: ActivityOutcome;
  subject?: ActivitySubject;
  /**
   * Products the event touched besides its subject, such as those of a bulk edit or an import;
   * each one's history shows the event.
   */
  relatedSubjectIds?: string[];
  /** How many items the action covered. */
  itemCount?: number;
  /** A short qualifier for the summary, such as "status set to archived". */
  detail?: string;
  /** A user-facing reason, for failed outcomes. Never pass secrets or internal errors. */
  failureReason?: string;
}
