import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import { ActivityAction } from '../enums/activity-action.enum.js';
import { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';
import type { ActivityEventRecord } from '../repositories/activity-event.queries.js';
import type { ActivityEventRepository } from '../repositories/activity-event.repository.js';
import { ActivityService } from './activity.service.js';

const WORKSPACE_ID = 'ws-1';
const CREATED_AT = new Date('2026-11-02T10:00:00Z');

function record(id: string, overrides: Partial<ActivityEventRecord> = {}): ActivityEventRecord {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    actorType: ActivityActorType.USER,
    actorUserId: 'user-1',
    actorApiKeyId: null,
    actorOAuthClientId: null,
    actorAgentName: null,
    actorUser: { name: 'Dana', email: 'dana@example.com' },
    actorApiKey: null,
    actorOAuthClient: null,
    action: ActivityAction.ProductUpdated,
    outcome: ActivityOutcome.SUCCEEDED,
    subjectType: ActivitySubjectType.Product,
    subjectId: 'p-1',
    subjectLabel: 'Mug',
    subjectIds: ['p-1'],
    itemCount: null,
    failureReason: null,
    connectionId: null,
    summary: 'Updated product “Mug”',
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function setup(records: ActivityEventRecord[]) {
  const repository = {
    listPage: vi
      .fn<ActivityEventRepository['listPage']>()
      .mockResolvedValue({ records, total: records.length }),
  };
  const service = new ActivityService(repository as unknown as ActivityEventRepository);
  return { service, repository };
}

describe('ActivityService', () => {
  it('returns a cursor when there is one more event than the limit', async () => {
    const { service } = setup([record('a'), record('b'), record('c')]);

    const page = await service.list(WORKSPACE_ID, { limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
  });

  it('names users and keys, and leaves system actions unnamed', async () => {
    const { service } = setup([
      record('user'),
      record('key', {
        actorType: ActivityActorType.API_KEY,
        actorUserId: null,
        actorUser: null,
        actorApiKeyId: 'key-1',
        actorApiKey: { name: 'MCP agent' },
      }),
      record('system', { actorType: ActivityActorType.SYSTEM, actorUserId: null, actorUser: null }),
    ]);

    const { items } = await service.list(WORKSPACE_ID, { limit: 25 });

    expect(items.map((item) => item.actor.name)).toEqual(['Dana', 'MCP agent', null]);
    expect(items[0]?.actor.email).toBe('dana@example.com');
  });

  it('skips actions this version does not know', async () => {
    const { service } = setup([record('known'), record('future', { action: 'order_refunded' })]);

    const { items } = await service.list(WORKSPACE_ID, { limit: 25 });

    expect(items.map((item) => item.id)).toEqual(['known']);
  });

  it('reads a product history through its subject ids, whatever the event’s subject', async () => {
    const { service, repository } = setup([]);

    await service.listForProduct(WORKSPACE_ID, 'p-1', { limit: 5 });

    expect(repository.listPage).toHaveBeenCalledWith(WORKSPACE_ID, { limit: 5, subjectId: 'p-1' });
  });
});
