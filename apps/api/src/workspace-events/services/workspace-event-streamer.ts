import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import {
  WORKSPACE_EVENT_PAGE_MAX_LIMIT,
  type WorkspaceEventPage,
  type WorkspaceEventScope,
  WorkspaceEventFeed,
} from '@crossmart/core';
import { abortableDelay, describeError } from '@crossmart/common';
import type { ServerSentEvents } from '../../common/sse/server-sent-events.js';
import { WorkspaceEventDto } from '../dto/workspace-event.dto.js';
import { WorkspaceStreamEventName } from '../enums/workspace-stream-event-name.enum.js';
import {
  WORKSPACE_EVENT_POLL_INTERVAL_MS,
  WORKSPACE_EVENT_RECONNECT_MS,
  WORKSPACE_EVENT_STREAM_LIFETIME_MS,
} from '../workspace-events.constants.js';

/** What one open stream reads, and where it starts: a cursor, or the latest events. */
export interface WorkspaceEventStreamRequest {
  scope: WorkspaceEventScope;
  after: string | null;
}

/**
 * Follows the workspace event stream for one client (ADR 0027): the backlog first, then a read
 * every couple of seconds (at once again while pages come back full), each event with its cursor
 * as the event id. It ends when the client leaves, after its lifetime, or at shutdown.
 */
@Injectable()
export class WorkspaceEventStreamer implements OnApplicationShutdown {
  private readonly logger = new Logger(WorkspaceEventStreamer.name);
  private readonly shutdown = new AbortController();

  constructor(private readonly feed: WorkspaceEventFeed) {}

  /** Throws only before anything was sent (a bad cursor), so the client gets a proper error. */
  async open(request: WorkspaceEventStreamRequest): Promise<WorkspaceEventPage> {
    const now = new Date();
    return request.after
      ? this.feed.after(request.scope, request.after, WORKSPACE_EVENT_PAGE_MAX_LIMIT, now)
      : this.feed.latest(request.scope, WORKSPACE_EVENT_PAGE_MAX_LIMIT, now);
  }

  /** Sends the first page, then follows the stream until it ends. */
  async follow(
    scope: WorkspaceEventScope,
    first: WorkspaceEventPage,
    events: ServerSentEvents,
  ): Promise<void> {
    const stop = this.stopSignal(events);
    events.retryAfter(WORKSPACE_EVENT_RECONNECT_MS);
    let cursor = this.send(first, events);
    events.send(WorkspaceStreamEventName.Ready, { cursor }, cursor);
    let full = first.items.length >= WORKSPACE_EVENT_PAGE_MAX_LIMIT;
    try {
      while (!stop.aborted) {
        if (!full) await abortableDelay(WORKSPACE_EVENT_POLL_INTERVAL_MS, stop);
        const page = await this.feed.after(
          scope,
          cursor,
          WORKSPACE_EVENT_PAGE_MAX_LIMIT,
          new Date(),
        );
        cursor = this.send(page, events);
        full = page.items.length >= WORKSPACE_EVENT_PAGE_MAX_LIMIT;
      }
    } catch (error) {
      if (!stop.aborted) this.logger.warn(`Event stream stopped: ${describeError(error)}`);
    }
  }

  onApplicationShutdown(): void {
    this.shutdown.abort();
  }

  /** Writes a page's events; returns the cursor to go on from. */
  private send(page: WorkspaceEventPage, events: ServerSentEvents): string {
    for (const item of page.items) {
      const dto = WorkspaceEventDto.from(item);
      events.send(WorkspaceStreamEventName.Event, dto, dto.cursor);
    }
    return page.cursor;
  }

  /** Aborts when the client leaves, the lifetime is up, or the app shuts down. */
  private stopSignal(events: ServerSentEvents): AbortSignal {
    const left = new AbortController();
    events.onClose(() => left.abort());
    return AbortSignal.any([
      left.signal,
      this.shutdown.signal,
      AbortSignal.timeout(WORKSPACE_EVENT_STREAM_LIFETIME_MS),
    ]);
  }
}
