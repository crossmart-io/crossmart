import { ChannelConnectionStatus } from '@crossmart/database';
import { AttentionStoreReason } from '../enums/attention-store-reason.enum.js';
import { storeAttentionReason } from './store-attention.js';

describe('storeAttentionReason', () => {
  it('flags stores to reconnect or fix, whatever their listings', () => {
    expect(storeAttentionReason({ status: ChannelConnectionStatus.NEEDS_REAUTH }, 0)).toBe(
      AttentionStoreReason.NeedsReauth,
    );
    expect(storeAttentionReason({ status: ChannelConnectionStatus.ERROR }, 0)).toBe(
      AttentionStoreReason.Error,
    );
  });

  it('flags a disconnected store only while it still has live listings', () => {
    expect(storeAttentionReason({ status: ChannelConnectionStatus.DISCONNECTED }, 3)).toBe(
      AttentionStoreReason.DisconnectedWithListings,
    );
    expect(storeAttentionReason({ status: ChannelConnectionStatus.DISCONNECTED }, 0)).toBeNull();
  });

  it('leaves a connected store alone', () => {
    expect(storeAttentionReason({ status: ChannelConnectionStatus.CONNECTED }, 12)).toBeNull();
  });
});
