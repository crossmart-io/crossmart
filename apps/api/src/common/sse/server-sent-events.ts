import type { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { EVENT_STREAM_HEADERS, SSE_HEARTBEAT, SSE_HEARTBEAT_INTERVAL_MS } from './sse.constants.js';

/**
 * Writes server-sent events to an Express response: named events with a JSON `data` line, and a
 * comment every few seconds so proxies keep a quiet stream (a long model call) open. Writes
 * after the client left are dropped.
 */
export class ServerSentEvents {
  private heartbeat: NodeJS.Timeout | undefined;

  constructor(private readonly response: Response) {}

  open(): void {
    this.response.status(HttpStatus.OK);
    for (const [name, value] of Object.entries(EVENT_STREAM_HEADERS)) {
      this.response.setHeader(name, value);
    }
    this.response.flushHeaders();
    this.heartbeat = setInterval(() => this.write(SSE_HEARTBEAT), SSE_HEARTBEAT_INTERVAL_MS);
  }

  send(event: string, data: unknown): void {
    this.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  /** Calls `listener` once the client is gone, whether it left early or the stream ended. */
  onClose(listener: () => void): void {
    this.response.on('close', listener);
  }

  close(): void {
    clearInterval(this.heartbeat);
    if (!this.response.writableEnded) this.response.end();
  }

  private write(chunk: string): void {
    if (!this.response.writableEnded && !this.response.destroyed) this.response.write(chunk);
  }
}
