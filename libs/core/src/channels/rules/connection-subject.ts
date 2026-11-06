import type { ActivitySubject } from '../../activity/entities/activity-entry.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';

/** A connection as the subject of an activity event, named as the merchant sees it now. */
export function connectionSubject({
  id,
  displayName,
}: Pick<ChannelConnectionView, 'id' | 'displayName'>): ActivitySubject {
  return { type: ActivitySubjectType.ChannelConnection, id, label: displayName };
}
