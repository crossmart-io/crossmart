import { Controller, Get, Headers, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { WorkspaceEventFeed, type WorkspaceEventScope, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';
import { ServerSentEvents } from '../../common/sse/server-sent-events.js';
import { RateLimitMessage } from '../../common/throttling/rate-limit-message.decorator.js';
import { WorkspacePrincipalThrottlerGuard } from '../../common/throttling/workspace-principal-throttler.guard.js';
import { CurrentEventScope } from '../decorators/current-event-scope.decorator.js';
import {
  ListWorkspaceEventsQueryDto,
  WorkspaceEventCursorQueryDto,
} from '../dto/list-workspace-events-query.dto.js';
import {
  WorkspaceEventDto,
  WorkspaceEventPageDto,
  WorkspaceEventStreamReadyDto,
} from '../dto/workspace-event.dto.js';
import { WorkspaceEventStreamer } from '../services/workspace-event-streamer.js';
import {
  EVENT_STREAM_CONTENT_TYPE,
  LAST_EVENT_ID_HEADER,
  WORKSPACE_EVENT_POLLS_PER_WINDOW,
  WORKSPACE_EVENT_STREAM_DESCRIPTION,
  WORKSPACE_EVENT_STREAMS_PER_WINDOW,
  WORKSPACE_EVENT_THROTTLE_WINDOW_MS,
  WORKSPACE_EVENTS_RATE_LIMITED_MESSAGE,
  WORKSPACE_EVENTS_ROUTE,
  WORKSPACE_EVENTS_STREAM_PATH,
  WORKSPACE_EVENTS_TAG,
} from '../workspace-events.constants.js';

/**
 * The workspace event stream (ADR 0027): what happens in a workspace as it happens, from the
 * activity log, Crossmart Agent, orders and webhook deliveries. Read with the activity log's
 * permission; each source also needs its own (orders, webhooks, Crossmart Agent).
 */
@ApiTags(WORKSPACE_EVENTS_TAG)
@ApiExtraModels(WorkspaceEventDto, WorkspaceEventStreamReadyDto)
@ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
@RequirePermission(WorkspacePermission.ViewActivity)
@AllowedWhileReadOnly()
@RateLimitMessage(WORKSPACE_EVENTS_RATE_LIMITED_MESSAGE)
@UseGuards(WorkspacePrincipalThrottlerGuard)
@Controller(WORKSPACE_EVENTS_ROUTE)
export class WorkspaceEventsController {
  constructor(
    private readonly feed: WorkspaceEventFeed,
    private readonly streamer: WorkspaceEventStreamer,
  ) {}

  @Get()
  @Throttle({
    default: { limit: WORKSPACE_EVENT_POLLS_PER_WINDOW, ttl: WORKSPACE_EVENT_THROTTLE_WINDOW_MS },
  })
  @ApiOperation({
    summary: 'What happened in the workspace, oldest first, after a cursor',
    description:
      'Without `after`, the latest events. Poll with the `cursor` of the previous page to follow ' +
      'the workspace without a stream; the newest second or two is held back so nothing is ' +
      'skipped. 400 for a cursor this API did not give out.',
  })
  @ApiOkResponse({ type: WorkspaceEventPageDto })
  @ApiTooManyRequestsResponse({ description: WORKSPACE_EVENTS_RATE_LIMITED_MESSAGE })
  async list(
    @Query() query: ListWorkspaceEventsQueryDto,
    @CurrentEventScope() scope: WorkspaceEventScope,
  ): Promise<WorkspaceEventPageDto> {
    const now = new Date();
    const page = query.after
      ? await this.feed.after(scope, query.after, query.limit, now)
      : await this.feed.latest(scope, query.limit, now);
    return WorkspaceEventPageDto.from(page);
  }

  @Get(WORKSPACE_EVENTS_STREAM_PATH)
  @Throttle({
    default: { limit: WORKSPACE_EVENT_STREAMS_PER_WINDOW, ttl: WORKSPACE_EVENT_THROTTLE_WINDOW_MS },
  })
  @ApiOperation({
    summary: 'Follow the workspace as it happens, as server-sent events',
    description: WORKSPACE_EVENT_STREAM_DESCRIPTION,
  })
  @ApiHeader({
    name: LAST_EVENT_ID_HEADER,
    required: false,
    description: 'Sent by a reconnecting client: go on after this event. Wins over `after`.',
  })
  @ApiProduces(EVENT_STREAM_CONTENT_TYPE)
  @ApiOkResponse({
    description: WORKSPACE_EVENT_STREAM_DESCRIPTION,
    content: {
      [EVENT_STREAM_CONTENT_TYPE]: { schema: { $ref: getSchemaPath(WorkspaceEventDto) } },
    },
  })
  @ApiTooManyRequestsResponse({ description: WORKSPACE_EVENTS_RATE_LIMITED_MESSAGE })
  async stream(
    @Query() query: WorkspaceEventCursorQueryDto,
    @Headers(LAST_EVENT_ID_HEADER) lastEventId: string | undefined,
    @CurrentEventScope() scope: WorkspaceEventScope,
    @Res() response: Response,
  ): Promise<void> {
    const first = await this.streamer.open({ scope, after: lastEventId || query.after || null });
    const events = new ServerSentEvents(response);
    events.open();
    try {
      await this.streamer.follow(scope, first, events);
    } finally {
      events.close();
    }
  }
}
