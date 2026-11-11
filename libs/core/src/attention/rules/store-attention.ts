import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { AttentionStoreReason } from '../enums/attention-store-reason.enum.js';

/** Why the store needs the merchant, or null when it does not. */
export function storeAttentionReason(
  store: Pick<ChannelConnectionView, 'status'>,
  liveListings: number,
): AttentionStoreReason | null {
  switch (store.status) {
    case ChannelConnectionStatus.NEEDS_REAUTH:
      return AttentionStoreReason.NeedsReauth;
    case ChannelConnectionStatus.ERROR:
      return AttentionStoreReason.Error;
    case ChannelConnectionStatus.DISCONNECTED:
      return liveListings > 0 ? AttentionStoreReason.DisconnectedWithListings : null;
    case ChannelConnectionStatus.CONNECTED:
      return null;
  }
}
