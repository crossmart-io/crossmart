import { describeError } from '@crossmart/common';
import { Injectable, Logger } from '@nestjs/common';
import type { ChannelEventListener, OrderChangedEvent } from '../entities/channel-events.js';

/**
 * Tells interested modules what channels reported, so the channels module that receives
 * webhooks need not know who handles them (orders do). Publishing never throws.
 */
@Injectable()
export class ChannelEventBus {
  private readonly logger = new Logger(ChannelEventBus.name);
  private readonly listeners: ChannelEventListener[] = [];

  subscribe(listener: ChannelEventListener): void {
    this.listeners.push(listener);
  }

  async orderChanged(event: OrderChangedEvent): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener.onOrderChanged(event);
      } catch (error) {
        const reason = describeError(error);
        this.logger.error(`A channel listener failed in workspace ${event.workspaceId}: ${reason}`);
      }
    }
  }
}
