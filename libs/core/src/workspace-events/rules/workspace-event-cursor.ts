import { z } from 'zod';
import type { WorkspaceEvent, WorkspaceEventPosition } from '../entities/workspace-event.js';
import { WORKSPACE_EVENT_ID_MAX_LENGTH } from '../workspace-events.constants.js';

const CURSOR_ENCODING = 'base64url';
const CURSOR_TEXT_ENCODING = 'utf8';

/** A cursor is `[milliseconds, id]` as JSON, in base64url: opaque to clients, checked on the way in. */
const CURSOR_SHAPE = z.tuple([
  z.number().int().nonnegative(),
  z.string().max(WORKSPACE_EVENT_ID_MAX_LENGTH),
]);

/** The cursor that resumes the stream right after `position`. */
export function encodeEventCursor(position: WorkspaceEventPosition): string {
  const json = JSON.stringify([position.occurredAt.getTime(), position.id]);
  return Buffer.from(json, CURSOR_TEXT_ENCODING).toString(CURSOR_ENCODING);
}

/** The position a cursor names; null for anything that is not a cursor this API gave out. */
export function decodeEventCursor(cursor: string): WorkspaceEventPosition | null {
  try {
    const json: unknown = JSON.parse(Buffer.from(cursor, CURSOR_ENCODING).toString());
    const parsed = CURSOR_SHAPE.safeParse(json);
    if (!parsed.success) return null;
    const [time, id] = parsed.data;
    return { occurredAt: new Date(time), id };
  } catch {
    return null;
  }
}

/** Orders positions by time, then by id, so events of the same millisecond keep one order. */
export function comparePositions(
  left: WorkspaceEventPosition,
  right: WorkspaceEventPosition,
): number {
  const byTime = left.occurredAt.getTime() - right.occurredAt.getTime();
  if (byTime !== 0) return byTime;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function positionOf(event: WorkspaceEvent): WorkspaceEventPosition {
  return { occurredAt: event.occurredAt, id: event.id };
}

/** Whether an event belongs in a window: after its position (if any) and not after `until`. */
export function isInWindow(
  event: WorkspaceEvent,
  after: WorkspaceEventPosition | null,
  since: Date,
  until: Date,
): boolean {
  const time = event.occurredAt.getTime();
  if (time > until.getTime() || time < since.getTime()) return false;
  return after === null || comparePositions(positionOf(event), after) > 0;
}
