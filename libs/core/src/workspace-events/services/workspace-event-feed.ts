import { Inject, Injectable } from '@nestjs/common';
import type {
  WorkspaceEvent,
  WorkspaceEventPage,
  WorkspaceEventPosition,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { InvalidEventCursorError } from '../errors/workspace-event.errors.js';
import {
  comparePositions,
  decodeEventCursor,
  encodeEventCursor,
  positionOf,
} from '../rules/workspace-event-cursor.js';
import type { WorkspaceEventSource } from '../sources/workspace-event-source.js';
import {
  WORKSPACE_EVENT_HISTORY_MS,
  WORKSPACE_EVENT_SETTLE_MS,
  WORKSPACE_EVENT_SOURCES,
} from '../workspace-events.constants.js';

/** The position of the end of a window: before any event at that time. */
const WATERMARK_ID = '';

function byPosition(left: WorkspaceEvent, right: WorkspaceEvent): number {
  return comparePositions(positionOf(left), positionOf(right));
}

function later(
  left: WorkspaceEventPosition,
  right: WorkspaceEventPosition,
): WorkspaceEventPosition {
  return comparePositions(left, right) >= 0 ? left : right;
}

/**
 * The workspace event stream (ADR 0027): what happened in a workspace, merged from its sources in
 * one order (time, then id), as pages with a cursor. Nothing younger than the settle time is
 * read, so a write that commits a moment after its timestamp is never skipped by a cursor.
 */
@Injectable()
export class WorkspaceEventFeed {
  constructor(
    @Inject(WORKSPACE_EVENT_SOURCES) private readonly sources: readonly WorkspaceEventSource[],
  ) {}

  /** The newest events, oldest first, with the cursor to follow the stream from them. */
  async latest(scope: WorkspaceEventScope, limit: number, now: Date): Promise<WorkspaceEventPage> {
    const until = this.settledAt(now);
    const since = new Date(until.getTime() - WORKSPACE_EVENT_HISTORY_MS);
    const events = await this.readAll(scope, { after: null, since, until, limit });
    const newest = events.sort(byPosition).slice(-limit);
    const last = newest.at(-1);
    return { items: newest, cursor: encodeEventCursor(last ? positionOf(last) : this.mark(until)) };
  }

  /** The events after `cursor`, oldest first; throws for a cursor this API did not give out. */
  async after(
    scope: WorkspaceEventScope,
    cursor: string,
    limit: number,
    now: Date,
  ): Promise<WorkspaceEventPage> {
    const after = decodeEventCursor(cursor);
    if (!after) throw new InvalidEventCursorError();
    const until = this.settledAt(now);
    const window = { after, since: after.occurredAt, until, limit };
    const items = (await this.readAll(scope, window)).sort(byPosition).slice(0, limit);
    return { items, cursor: encodeEventCursor(this.nextPosition(items, after, until, limit)) };
  }

  /**
   * Where the next page starts: after the last event of a full page (more may follow), else at
   * the end of the window, so an idle stream does not read the same range again.
   */
  private nextPosition(
    items: WorkspaceEvent[],
    after: WorkspaceEventPosition,
    until: Date,
    limit: number,
  ): WorkspaceEventPosition {
    const last = items.at(-1);
    const reached = last ? positionOf(last) : after;
    return items.length >= limit ? reached : later(reached, this.mark(until));
  }

  private async readAll(
    scope: WorkspaceEventScope,
    window: WorkspaceEventWindow,
  ): Promise<WorkspaceEvent[]> {
    const readable = this.sources.filter((source) => scope.permissions.has(source.permission));
    const pages = await Promise.all(readable.map((source) => source.read(scope, window)));
    return pages.flat();
  }

  private settledAt(now: Date): Date {
    return new Date(now.getTime() - WORKSPACE_EVENT_SETTLE_MS);
  }

  private mark(until: Date): WorkspaceEventPosition {
    return { occurredAt: until, id: WATERMARK_ID };
  }
}
