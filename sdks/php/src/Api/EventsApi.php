<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Exception\CrossmartExceptionInterface;
use Crossmart\Http\ApiRequest;
use Crossmart\Http\HttpMethod;
use Crossmart\Http\TransportInterface;
use Crossmart\Model\WorkspaceEventPageDto;

/**
 * The operations tagged "Events".
 */
final class EventsApi
{
    public function __construct(private readonly TransportInterface $transport)
    {
    }

    /**
     * What happened in the workspace, oldest first, after a cursor
     *
     * Without `after`, the latest events. Poll with the `cursor` of the previous page to follow the workspace without a stream; the newest second or two is held back so nothing is skipped. 400 for a cursor this API did not give out.
     *
     * @param string|null $after The `cursor` of a previous page or event: only what happened after it. Without it, the latest events.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspaceEventsControllerListV1(
        string $workspaceId,
        ?string $after = null,
        int|float|null $limit = null,
    ): WorkspaceEventPageDto {
        $response = $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/events',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['after' => $after, 'limit' => $limit],
        ));

        return WorkspaceEventPageDto::fromArray($response->object());
    }

    /**
     * Follow the workspace as it happens, as server-sent events
     *
     * Server-sent events. Each `workspace_event` carries one `WorkspaceEventDto` as JSON, with its `cursor` as the event id. Without a cursor the stream starts with the latest events. `ready` (its id is the cursor) says the backlog is out. A comment every 15 seconds keeps the connection open; the stream ends after 10 minutes, and the client reconnects with `Last-Event-ID` to go on where it was.
     *
     * @param string|null $after The `cursor` of a previous page or event: only what happened after it. Without it, the latest events.
     *
     * @throws CrossmartExceptionInterface When the API cannot be reached or answers with an error.
     */
    public function workspaceEventsControllerStreamV1(
        string $workspaceId,
        ?string $after = null,
    ): void {
        $this->transport->send(new ApiRequest(
            method: HttpMethod::Get,
            pathTemplate: '/api/v1/workspaces/{workspaceId}/events/stream',
            pathParameters: ['workspaceId' => $workspaceId],
            query: ['after' => $after],
        ));
    }
}
