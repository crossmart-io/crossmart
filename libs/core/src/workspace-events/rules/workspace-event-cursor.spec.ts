import { WorkspaceEventCategory } from '../enums/workspace-event-category.enum.js';
import { WorkspaceEventSeverity } from '../enums/workspace-event-severity.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { workspaceEvent } from '../testing/workspace-event.fixture.js';
import {
  comparePositions,
  decodeEventCursor,
  encodeEventCursor,
  isInWindow,
} from './workspace-event-cursor.js';

const AT = new Date('2026-11-08T10:00:00.000Z');

describe('workspace event cursors', () => {
  it('round-trips a position', () => {
    const position = { occurredAt: AT, id: 'activity:5b1c' };
    expect(decodeEventCursor(encodeEventCursor(position))).toEqual(position);
  });

  it('refuses text that is not a cursor', () => {
    expect(decodeEventCursor('not-a-cursor')).toBeNull();
    expect(decodeEventCursor(Buffer.from('["x","y"]').toString('base64url'))).toBeNull();
    expect(decodeEventCursor(Buffer.from('[-1,"y"]').toString('base64url'))).toBeNull();
  });

  it('orders by time, then by id', () => {
    const later = new Date(AT.getTime() + 1);
    expect(comparePositions({ occurredAt: AT, id: 'b' }, { occurredAt: later, id: 'a' })).toBe(-1);
    expect(comparePositions({ occurredAt: AT, id: 'b' }, { occurredAt: AT, id: 'a' })).toBe(1);
    expect(comparePositions({ occurredAt: AT, id: 'a' }, { occurredAt: AT, id: 'a' })).toBe(0);
  });

  it('keeps an event after the position and up to the end of the window', () => {
    const event = workspaceEvent({
      id: 'b',
      occurredAt: AT,
      type: WorkspaceEventType.OrderReceived,
      category: WorkspaceEventCategory.Orders,
      severity: WorkspaceEventSeverity.Info,
    });
    const since = new Date(0);
    expect(isInWindow(event, { occurredAt: AT, id: 'a' }, since, AT)).toBe(true);
    expect(isInWindow(event, { occurredAt: AT, id: 'b' }, since, AT)).toBe(false);
    expect(isInWindow(event, null, since, new Date(AT.getTime() - 1))).toBe(false);
    expect(isInWindow(event, null, new Date(AT.getTime() + 1), new Date(AT.getTime() + 2))).toBe(
      false,
    );
  });
});
