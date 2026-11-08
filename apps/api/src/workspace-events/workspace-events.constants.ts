import { MS_PER_MINUTE } from '@crossmart/common';

export const WORKSPACE_EVENTS_TAG = 'Events';
export const WORKSPACE_EVENTS_ROUTE = 'workspaces/:workspaceId/events';
export const WORKSPACE_EVENTS_STREAM_PATH = 'stream';

/** The header a reconnecting `EventSource` sends with the id of the last event it read. */
export const LAST_EVENT_ID_HEADER = 'last-event-id';

/** Schema names the generated clients use for the stream's enums. */
export const WORKSPACE_EVENT_TYPE_SCHEMA_NAME = 'WorkspaceEventType';
export const WORKSPACE_EVENT_CATEGORY_SCHEMA_NAME = 'WorkspaceEventCategory';
export const WORKSPACE_EVENT_SEVERITY_SCHEMA_NAME = 'WorkspaceEventSeverity';
export const WORKSPACE_STREAM_EVENT_NAME_SCHEMA_NAME = 'WorkspaceStreamEventName';

/** How often an open stream looks for new events, and how fast a page that filled is followed. */
export const WORKSPACE_EVENT_POLL_INTERVAL_MS = 2_000;
/**
 * A stream ends after this long and the client reconnects (with `Last-Event-ID`), so its access
 * is checked again: someone removed from the workspace stops receiving within this time.
 */
export const WORKSPACE_EVENT_STREAM_LIFETIME_MS = 10 * MS_PER_MINUTE;
/** How long a client waits before reconnecting, sent as the stream's `retry`. */
export const WORKSPACE_EVENT_RECONNECT_MS = 3_000;

/** Per workspace and caller: opening streams, and polling the list. */
export const WORKSPACE_EVENT_THROTTLE_WINDOW_MS = MS_PER_MINUTE;
export const WORKSPACE_EVENT_STREAMS_PER_WINDOW = 30;
export const WORKSPACE_EVENT_POLLS_PER_WINDOW = 120;
export const WORKSPACE_EVENTS_RATE_LIMITED_MESSAGE =
  'Too many requests for the event stream. Wait a minute and try again.';

export const EVENT_STREAM_CONTENT_TYPE = 'text/event-stream';
export const WORKSPACE_EVENT_STREAM_DESCRIPTION =
  'Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with ' +
  'its `cursor` as the event id. Without a cursor the stream starts with the latest events. ' +
  '`ready` (its id is the cursor) says the backlog is out. A comment every 15 seconds keeps the ' +
  'connection open; the stream ends after 10 minutes, and the client reconnects with ' +
  '`Last-Event-ID` to go on where it was.';
