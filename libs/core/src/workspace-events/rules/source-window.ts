import { SortDirection } from '@crossmart/common';
import type { WorkspaceEventWindow } from '../entities/workspace-event.js';
import { EVENT_ID_SEPARATOR } from '../workspace-events.constants.js';

/** A time range on a source's timestamp column, as Prisma filters take it. */
export interface TimeCondition {
  gte?: Date;
  gt?: Date;
  lte: Date;
}

/** Rows at exactly the last position's time that come after it by id. */
export interface TieCondition {
  time: Date;
  idAfter: string;
}

/**
 * A window as one source with one event per row reads it. Its event ids are `<prefix>:<row id>`,
 * so rows at the time of the last position come after it when the position is another source's
 * that sorts before this prefix, or this source's with a smaller row id.
 */
export class SourceWindow {
  constructor(
    private readonly window: WorkspaceEventWindow,
    private readonly prefix: string,
  ) {}

  get limit(): number {
    return this.window.limit;
  }

  /** Oldest first after a position, so the cursor moves forward; newest first for the history. */
  get direction(): SortDirection {
    return this.window.after ? SortDirection.Asc : SortDirection.Desc;
  }

  /** The time range rows must fall in, ties at the position's time aside. */
  time(): TimeCondition {
    const { after, since, until } = this.window;
    if (!after) return { gte: since, lte: until };
    const sourceKey = `${this.prefix}${EVENT_ID_SEPARATOR}`;
    if (!after.id.startsWith(sourceKey) && after.id < sourceKey) {
      return { gte: after.occurredAt, lte: until };
    }
    return { gt: after.occurredAt, lte: until };
  }

  /** This source's rows at the position's time with a larger id; null when none can follow. */
  tie(): TieCondition | null {
    const { after } = this.window;
    const sourceKey = `${this.prefix}${EVENT_ID_SEPARATOR}`;
    if (!after?.id.startsWith(sourceKey)) return null;
    return { time: after.occurredAt, idAfter: after.id.slice(sourceKey.length) };
  }
}
