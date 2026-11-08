import { SortDirection } from '@crossmart/common';
import { SourceWindow } from './source-window.js';

const SINCE = new Date('2026-11-01T00:00:00.000Z');
const AT = new Date('2026-11-08T10:00:00.000Z');
const UNTIL = new Date('2026-11-08T11:00:00.000Z');

function windowAfter(id: string | null): SourceWindow {
  const after = id ? { occurredAt: AT, id } : null;
  return new SourceWindow({ after, since: SINCE, until: UNTIL, limit: 10 }, 'order');
}

describe('SourceWindow', () => {
  it('reads the newest rows of the history without a position', () => {
    const window = windowAfter(null);
    expect(window.direction).toBe(SortDirection.Desc);
    expect(window.time()).toEqual({ gte: SINCE, lte: UNTIL });
    expect(window.tie()).toBeNull();
  });

  it('includes rows at the position’s time when another source sorting earlier was last', () => {
    const window = windowAfter('activity:9');
    expect(window.direction).toBe(SortDirection.Asc);
    expect(window.time()).toEqual({ gte: AT, lte: UNTIL });
    expect(window.tie()).toBeNull();
  });

  it('skips rows at the position’s time when a source sorting later was last', () => {
    expect(windowAfter('webhook:1').time()).toEqual({ gt: AT, lte: UNTIL });
  });

  it('continues by row id after its own last row', () => {
    const window = windowAfter('order:5');
    expect(window.time()).toEqual({ gt: AT, lte: UNTIL });
    expect(window.tie()).toEqual({ time: AT, idAfter: '5' });
  });
});
