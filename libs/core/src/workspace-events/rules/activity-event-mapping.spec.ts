import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import type { ActivityEventView } from '../../activity/entities/activity-event-view.js';
import { AGENT_WORKER_NAME } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { WorkspaceEventSeverity } from '../enums/workspace-event-severity.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { fromActivityEvent, isViewersOwnAgentChange } from './activity-event-mapping.js';
import { toWorkspaceEvent } from './workspace-event-kinds.js';

function view(overrides: Partial<ActivityEventView> = {}): ActivityEventView {
  return {
    id: 'e-1',
    action: ActivityAction.ProductUpdated,
    outcome: ActivityOutcome.SUCCEEDED,
    summary: 'Updated product “Mug”',
    actor: {
      type: ActivityActorType.USER,
      userId: 'u-1',
      apiKeyId: null,
      agentClientId: null,
      name: 'Dana',
      email: 'dana@example.com',
      agentName: null,
      approvedByUserId: null,
      approvedByName: null,
    },
    subject: { type: ActivitySubjectType.Product, id: 'p-1', label: 'Mug' },
    itemCount: null,
    failureReason: null,
    connectionId: null,
    createdAt: new Date('2026-11-08T10:00:00.000Z'),
    ...overrides,
  };
}

describe('activity events in the stream', () => {
  it('names a refused listing by its own type, with the store’s reason and the store', () => {
    const event = toWorkspaceEvent(
      fromActivityEvent(
        view({
          action: ActivityAction.ListingSyncFailed,
          outcome: ActivityOutcome.FAILED,
          failureReason: 'Item specific Brand is missing',
          connectionId: 'c-1',
          actor: { ...view().actor, type: ActivityActorType.SYSTEM, name: null },
        }),
      ),
    );
    expect(event).toMatchObject({
      id: 'activity:e-1',
      type: WorkspaceEventType.ListingFailed,
      severity: WorkspaceEventSeverity.Error,
      detail: 'Item specific Brand is missing',
      refs: { connectionId: 'c-1', productId: 'p-1' },
    });
  });

  it('calls a connected agent’s or an API key’s change agent activity, a person’s a change', () => {
    const agent = { ...view().actor, type: ActivityActorType.AGENT, agentName: 'Claude' };
    const key = { ...view().actor, type: ActivityActorType.API_KEY, name: 'n8n' };
    expect(fromActivityEvent(view({ actor: agent })).type).toBe(WorkspaceEventType.AgentActivity);
    expect(fromActivityEvent(view({ actor: key })).type).toBe(WorkspaceEventType.AgentActivity);
    expect(fromActivityEvent(view()).type).toBe(WorkspaceEventType.WorkspaceChange);
  });

  it('reads any failed operation as an error', () => {
    const failed = toWorkspaceEvent(fromActivityEvent(view({ outcome: ActivityOutcome.FAILED })));
    expect(failed.severity).toBe(WorkspaceEventSeverity.Error);
  });

  it('leaves out Crossmart Agent’s changes for the reader, whose conversation shows them', () => {
    const own = view({
      actor: { ...view().actor, type: ActivityActorType.AGENT, agentName: AGENT_WORKER_NAME },
    });
    expect(isViewersOwnAgentChange(own, 'u-1')).toBe(true);
    expect(isViewersOwnAgentChange(own, 'u-2')).toBe(false);
    expect(isViewersOwnAgentChange(own, null)).toBe(false);
    expect(isViewersOwnAgentChange(view(), 'u-1')).toBe(false);
  });
});
