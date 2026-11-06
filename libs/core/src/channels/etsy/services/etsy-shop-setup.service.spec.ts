import { BadRequestException } from '@nestjs/common';
import {
  type ChannelSession,
  ChannelType,
  type EtsyConnector,
  type EtsySettings,
  EtsyWhenMade,
  EtsyWhoMade,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import type { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import type { ConnectionAccountStore } from '../../services/connection-account.store.js';
import { EtsyShopSetupService } from './etsy-shop-setup.service.js';

const ACTOR = Actor.user('user-1');
const SETUP = {
  whoMade: EtsyWhoMade.IDid,
  whenMade: EtsyWhenMade.MadeToOrder,
  isSupply: false,
  shippingProfileId: '6722757781',
  processingProfileId: null,
};
const SETTINGS: EtsySettings = {
  channel: ChannelType.Etsy,
  shopId: '87654321',
  shopName: 'ClayAndKiln',
  userId: '12345678',
  currencyCode: 'USD',
  shopUrl: null,
  profiles: {
    shipping: [{ id: '6722757781', name: 'Free US shipping' }],
    processing: [{ id: '18201076875', name: 'Ready to ship · 1-3 days' }],
  },
};

function connection(account: ChannelConnectionView['settings']['account'] = SETTINGS) {
  return {
    id: 'c1',
    channel: ChannelType.Etsy,
    displayName: 'ClayAndKiln',
    status: ChannelConnectionStatus.CONNECTED,
    settings: { account, productSelection: null, pricing: null },
  } as ChannelConnectionView;
}

function setup(view = connection()) {
  const store = {
    get: vi.fn<ConnectionAccountStore['get']>().mockResolvedValue(view),
    saveAccount: vi.fn<ConnectionAccountStore['saveAccount']>().mockResolvedValue(view),
  };
  const sessions = {
    open: vi.fn<ChannelSessionFactory['open']>().mockResolvedValue({} as ChannelSession),
  };
  const refreshed = { ...SETTINGS, shopName: 'ClayAndKilnStudio' };
  const etsy = {
    describeAccount: vi
      .fn()
      .mockResolvedValue({ displayName: 'ClayAndKilnStudio', settings: refreshed }),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new EtsyShopSetupService(
    store as unknown as ConnectionAccountStore,
    sessions as unknown as ChannelSessionFactory,
    etsy as unknown as EtsyConnector,
    activity,
  );
  return { service, store, activity };
}

describe('EtsyShopSetupService', () => {
  it('saves the listing setup and records it', async () => {
    const { service, store, activity } = setup();

    await service.saveListingSetup('w1', 'c1', SETUP, ACTOR);

    expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
      ...SETTINGS,
      listingSetup: SETUP,
    });
    expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelListingDefaultsUpdated);
  });

  it('refuses profiles the shop does not have, and connections of other channels', async () => {
    await expect(
      setup().service.saveListingSetup('w1', 'c1', { ...SETUP, shippingProfileId: '1' }, ACTOR),
    ).rejects.toThrow(BadRequestException);
    await expect(
      setup(connection({ channel: ChannelType.Shopify })).service.saveListingSetup(
        'w1',
        'c1',
        SETUP,
        ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('reads the shop again and keeps the listing setup', async () => {
    const withSetup: EtsySettings = { ...SETTINGS, listingSetup: SETUP };
    const { service, store } = setup(connection(withSetup));

    await service.refreshShop('w1', 'c1');

    expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
      ...SETTINGS,
      shopName: 'ClayAndKilnStudio',
      listingSetup: SETUP,
    });
  });
});
