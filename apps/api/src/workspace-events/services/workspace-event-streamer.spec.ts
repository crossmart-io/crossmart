import {
  WORKSPACE_EVENT_PAGE_MAX_LIMIT,
  type WorkspaceEventFeed,
  type WorkspaceEventPage,
  WorkspacePermission,
} from '@crossmart/core';
import { workspaceEvent } from '@crossmart/core/workspace-events/testing/workspace-event.fixture.js';
import type { ServerSentEvents } from '../../common/sse/server-sent-events.js';
import { WorkspaceStreamEventName } from '../enums/workspace-stream-event-name.enum.js';
import { WORKSPACE_EVENT_POLL_INTERVAL_MS } from '../workspace-events.constants.js';
import { WorkspaceEventStreamer } from './workspace-event-streamer.js';

const SCOPE = {
  workspaceId: 'ws-1',
  viewerUserId: 'u-1',
  permissions: new Set([WorkspacePermission.ViewActivity]),
};

interface Sent {
  event: string;
  id: string | undefined;
}

/** Records what the streamer sends; `leave()` closes the stream as a client would. */
function fakeStream() {
  const sent: Sent[] = [];
  let onClose: () => void = () => undefined;
  const events = {
    send: (event: string, _data: unknown, id?: string) => sent.push({ event, id }),
    retryAfter: vi.fn(),
    onClose: (listener: () => void) => {
      onClose = listener;
    },
  };
  return { events: events as unknown as ServerSentEvents, sent, leave: () => onClose() };
}

function page(cursor: string, ...ids: string[]): WorkspaceEventPage {
  return { items: ids.map((id) => workspaceEvent({ id })), cursor };
}

describe('WorkspaceEventStreamer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens on the latest events, or after the cursor it was given', async () => {
    const feed = {
      latest: vi.fn<WorkspaceEventFeed['latest']>().mockResolvedValue(page('c-1')),
      after: vi.fn<WorkspaceEventFeed['after']>().mockResolvedValue(page('c-2')),
    };
    const streamer = new WorkspaceEventStreamer(feed as unknown as WorkspaceEventFeed);

    await streamer.open({ scope: SCOPE, after: null });
    await streamer.open({ scope: SCOPE, after: 'c-0' });

    expect(feed.latest).toHaveBeenCalledWith(
      SCOPE,
      WORKSPACE_EVENT_PAGE_MAX_LIMIT,
      expect.any(Date),
    );
    expect(feed.after).toHaveBeenCalledWith(
      SCOPE,
      'c-0',
      WORKSPACE_EVENT_PAGE_MAX_LIMIT,
      expect.any(Date),
    );
  });

  it('sends the backlog, says it is ready, then polls from the cursor until the client leaves', async () => {
    const feed = {
      after: vi
        .fn<WorkspaceEventFeed['after']>()
        .mockResolvedValueOnce(page('c-2', 'order:2'))
        .mockResolvedValue(page('c-3')),
    };
    const streamer = new WorkspaceEventStreamer(feed as unknown as WorkspaceEventFeed);
    const { events, sent, leave } = fakeStream();

    const following = streamer.follow(SCOPE, page('c-1', 'activity:1'), events);
    await vi.advanceTimersByTimeAsync(WORKSPACE_EVENT_POLL_INTERVAL_MS * 2);
    leave();
    await following;

    expect(sent.map(({ event }) => event)).toEqual([
      WorkspaceStreamEventName.Event,
      WorkspaceStreamEventName.Ready,
      WorkspaceStreamEventName.Event,
    ]);
    expect(sent[1]?.id).toBe('c-1');
    expect(feed.after.mock.calls.map(([, cursor]) => cursor)).toEqual(['c-1', 'c-2']);
  });

  it('stops every stream at shutdown', async () => {
    const feed = { after: vi.fn<WorkspaceEventFeed['after']>().mockResolvedValue(page('c-2')) };
    const streamer = new WorkspaceEventStreamer(feed as unknown as WorkspaceEventFeed);
    const { events } = fakeStream();

    const following = streamer.follow(SCOPE, page('c-1'), events);
    streamer.onApplicationShutdown();
    await following;

    expect(feed.after).not.toHaveBeenCalled();
  });
});
