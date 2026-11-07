/** Headers of an event stream: no caching, no buffering by proxies (nginx honours the last). */
export const EVENT_STREAM_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  'x-accel-buffering': 'no',
};

/** A comment line, ignored by clients, that keeps an idle stream open through proxies. */
export const SSE_HEARTBEAT = ': keep-alive\n\n';
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;
