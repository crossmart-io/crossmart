import { MS_PER_DAY } from '@crossmart/common';

export const WORKSPACE_EVENT_PAGE_DEFAULT_LIMIT = 50;
export const WORKSPACE_EVENT_PAGE_MAX_LIMIT = 100;

/**
 * Events younger than this are held back for the next read, so a write whose transaction commits
 * a moment after its timestamp is still read in order, never skipped by a cursor that moved on.
 */
export const WORKSPACE_EVENT_SETTLE_MS = 1_500;

/** How far back the first page looks; older events are in the activity log. */
export const WORKSPACE_EVENT_HISTORY_MS = 7 * MS_PER_DAY;

/** Injection token for every source the feed merges. */
export const WORKSPACE_EVENT_SOURCES = Symbol('WORKSPACE_EVENT_SOURCES');

/** Event ids are a source, a uuid and a step: far shorter than this. */
export const WORKSPACE_EVENT_ID_MAX_LENGTH = 200;

/** Separates the parts of an event id: its source, the record and, for a record with several events, the step. */
export const EVENT_ID_SEPARATOR = ':';

export const INVALID_EVENT_CURSOR =
  'The cursor is not valid. Use the `cursor` of a previous page, or leave it out.';
