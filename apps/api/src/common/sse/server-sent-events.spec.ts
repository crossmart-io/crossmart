import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import { ServerSentEvents } from './server-sent-events.js';

/** Just enough of an Express response to write an event stream to. */
class FakeResponse extends EventEmitter {
  readonly chunks: string[] = [];
  writableEnded = false;
  destroyed = false;
  status = vi.fn().mockReturnThis();
  setHeader = vi.fn();
  flushHeaders = vi.fn();

  write(chunk: string): boolean {
    this.chunks.push(chunk);
    return true;
  }

  end(): void {
    this.writableEnded = true;
  }
}

function open() {
  const response = new FakeResponse();
  const events = new ServerSentEvents(response as unknown as Response);
  events.open();
  return { response, events };
}

describe('ServerSentEvents', () => {
  it('writes a named event, with an id a reconnecting client sends back', () => {
    const { response, events } = open();

    events.send('ready', { cursor: 'c-1' }, 'c-1');
    events.send('message', { text: 'hi' });
    events.retryAfter(3000);
    events.close();

    expect(response.chunks).toEqual([
      'id: c-1\nevent: ready\ndata: {"cursor":"c-1"}\n\n',
      'event: message\ndata: {"text":"hi"}\n\n',
      'retry: 3000\n\n',
    ]);
  });

  it('drops writes once the client has gone, and says so', () => {
    const { response, events } = open();
    const left = vi.fn();
    events.onClose(left);

    response.destroyed = true;
    response.emit('close');
    events.send('message', {});

    expect(events.isOpen).toBe(false);
    expect(left).toHaveBeenCalledOnce();
    expect(response.chunks).toEqual([]);
    events.close();
  });
});
