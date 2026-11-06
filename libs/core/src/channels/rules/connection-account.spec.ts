import { BadRequestException } from '@nestjs/common';
import { ChannelType, type EbaySettings, isEbaySettings } from '@crossmart/connectors';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import type { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import type { ConnectionAccountStore } from '../services/connection-account.store.js';
import { loadConnectionAccount, recordConnectionChange } from './connection-account.js';

const EBAY_KIND = { isAccount: isEbaySettings, notThisChannel: 'Not eBay' };
const EBAY_ACCOUNT = { channel: ChannelType.Ebay } as EbaySettings;
const GOOGLE_ACCOUNT = { channel: ChannelType.GoogleMerchant } as unknown as EbaySettings;

function connection(account: unknown): ChannelConnectionView {
  return {
    id: 'connection-1',
    displayName: 'eBay US',
    settings: { account },
  } as unknown as ChannelConnectionView;
}

function storeOf(view: ChannelConnectionView): ConnectionAccountStore {
  return { get: vi.fn().mockResolvedValue(view) } as unknown as ConnectionAccountStore;
}

describe('loadConnectionAccount', () => {
  it('answers the connection and its account settings', async () => {
    const view = connection(EBAY_ACCOUNT);

    const loaded = await loadConnectionAccount(storeOf(view), 'ws', 'connection-1', EBAY_KIND);

    expect(loaded).toEqual({ connection: view, settings: { channel: ChannelType.Ebay } });
  });

  it('refuses another channel’s account, or one never read', async () => {
    const google = connection(GOOGLE_ACCOUNT);

    await expect(
      loadConnectionAccount(storeOf(google), 'ws', 'connection-1', EBAY_KIND),
    ).rejects.toThrow(new BadRequestException('Not eBay'));
    await expect(
      loadConnectionAccount(storeOf(connection(null)), 'ws', 'connection-1', EBAY_KIND),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('recordConnectionChange', () => {
  it('records the action with the connection as its subject', async () => {
    const activity = { record: vi.fn<ActivityRecorder['record']>().mockResolvedValue() };
    const actor = Actor.system();

    await recordConnectionChange(activity as unknown as ActivityRecorder, 'ws', actor, {
      action: ActivityAction.ChannelListingDefaultsUpdated,
      connection: connection(null),
    });

    expect(activity.record).toHaveBeenCalledWith('ws', actor, {
      action: ActivityAction.ChannelListingDefaultsUpdated,
      subject: {
        type: ActivitySubjectType.ChannelConnection,
        id: 'connection-1',
        label: 'eBay US',
      },
    });
  });
});
