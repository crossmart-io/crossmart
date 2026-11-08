import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { InvalidEventCursorError } from '../errors/workspace-event.errors.js';
import {
  decodeEventCursor,
  encodeEventCursor,
  isInWindow,
} from '../rules/workspace-event-cursor.js';
import { WorkspaceEventSource } from '../sources/workspace-event-source.js';
import { workspaceEvent } from '../testing/workspace-event.fixture.js';
import { WORKSPACE_EVENT_SETTLE_MS } from '../workspace-events.constants.js';
import { WorkspaceEventFeed } from './workspace-event-feed.js';

const NOW = new Date('2026-11-08T10:00:10.000Z');
const SETTLED = new Date(NOW.getTime() - WORKSPACE_EVENT_SETTLE_MS);

function at(seconds: number): Date {
  return new Date(`2026-11-08T10:00:0${seconds}.000Z`);
}

/** A source over a fixed list, honouring the window like a real one. */
class ListSource extends WorkspaceEventSource {
  readonly windows: WorkspaceEventWindow[] = [];

  constructor(
    readonly permission: WorkspacePermission,
    private readonly events: WorkspaceEvent[],
  ) {
    super();
  }

  read(_scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    this.windows.push(window);
    const inWindow = this.events.filter((event) =>
      isInWindow(event, window.after, window.since, window.until),
    );
    const ordered = window.after ? inWindow : [...inWindow].reverse();
    return Promise.resolve(ordered.slice(0, window.limit));
  }
}

const activity = new ListSource(WorkspacePermission.ViewActivity, [
  workspaceEvent({ id: 'activity:1', occurredAt: at(1) }),
  workspaceEvent({ id: 'activity:3', occurredAt: at(3) }),
  workspaceEvent({ id: 'activity:9', occurredAt: at(9) }),
]);
const orders = new ListSource(WorkspacePermission.ViewOrders, [
  workspaceEvent({ id: 'order:2', occurredAt: at(2) }),
]);
const feed = new WorkspaceEventFeed([activity, orders]);

function scope(...permissions: WorkspacePermission[]): WorkspaceEventScope {
  return { workspaceId: 'ws-1', viewerUserId: 'u-1', permissions: new Set(permissions) };
}

const EVERYTHING = scope(WorkspacePermission.ViewActivity, WorkspacePermission.ViewOrders);

describe('WorkspaceEventFeed', () => {
  it('merges the sources in time order and holds back what is not settled yet', async () => {
    const page = await feed.latest(EVERYTHING, 10, NOW);

    expect(page.items.map(({ id }) => id)).toEqual(['activity:1', 'order:2', 'activity:3']);
    expect(decodeEventCursor(page.cursor)).toEqual({ occurredAt: at(3), id: 'activity:3' });
    expect(activity.windows.at(-1)?.until).toEqual(SETTLED);
  });

  it('keeps the newest events of the history when there are more than asked for', async () => {
    const page = await feed.latest(EVERYTHING, 2, NOW);
    expect(page.items.map(({ id }) => id)).toEqual(['order:2', 'activity:3']);
  });

  it('reads only the sources the reader may see', async () => {
    const page = await feed.latest(scope(WorkspacePermission.ViewActivity), 10, NOW);
    expect(page.items.map(({ id }) => id)).toEqual(['activity:1', 'activity:3']);
  });

  it('follows a cursor, and moves an idle cursor to the end of the window', async () => {
    const cursor = encodeEventCursor({ occurredAt: at(2), id: 'order:2' });
    const page = await feed.after(EVERYTHING, cursor, 10, NOW);

    expect(page.items.map(({ id }) => id)).toEqual(['activity:3']);
    expect(decodeEventCursor(page.cursor)).toEqual({ occurredAt: SETTLED, id: '' });

    const later = await feed.after(EVERYTHING, page.cursor, 10, new Date(at(9).getTime() + 2_000));
    expect(later.items.map(({ id }) => id)).toEqual(['activity:9']);
  });

  it('stops at the last event of a full page, so the rest follows', async () => {
    const cursor = encodeEventCursor({ occurredAt: at(0), id: '' });
    const page = await feed.after(EVERYTHING, cursor, 2, NOW);

    expect(page.items.map(({ id }) => id)).toEqual(['activity:1', 'order:2']);
    expect(decodeEventCursor(page.cursor)).toEqual({ occurredAt: at(2), id: 'order:2' });
  });

  it('starts an empty stream at the end of the window', async () => {
    const page = await new WorkspaceEventFeed([]).latest(EVERYTHING, 10, NOW);
    expect(page.items).toEqual([]);
    expect(decodeEventCursor(page.cursor)).toEqual({ occurredAt: SETTLED, id: '' });
  });

  it('refuses a cursor it did not give out', async () => {
    await expect(feed.after(EVERYTHING, 'nope', 10, NOW)).rejects.toThrow(InvalidEventCursorError);
  });
});
