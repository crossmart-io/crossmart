import { Injectable } from '@nestjs/common';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { AttentionList, AttentionStore } from '../entities/attention-summary.js';
import { AttentionRepository } from '../repositories/attention.repository.js';
import { storeAttentionReason } from '../rules/store-attention.js';

function toAttentionStore(store: ChannelConnectionView, liveListings: number): AttentionStore[] {
  const reason = storeAttentionReason(store, liveListings);
  if (!reason) return [];
  const { id, channel, displayName, status, statusReason } = store;
  return [{ connectionId: id, channel, displayName, status, statusReason, reason, liveListings }];
}

/** Stores to reconnect or fix, and disconnected ones that still have live listings. */
@Injectable()
export class StoreAttentionReader {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly attention: AttentionRepository,
  ) {}

  async read(workspaceId: string, limit: number): Promise<AttentionList<AttentionStore>> {
    const stores = await this.connections.list(workspaceId);
    const live = await this.attention.countLiveListings(
      workspaceId,
      stores.map((store) => store.id),
    );
    const needing = stores.flatMap((store) => toAttentionStore(store, live.get(store.id) ?? 0));
    return { count: needing.length, items: needing.slice(0, limit) };
  }
}
