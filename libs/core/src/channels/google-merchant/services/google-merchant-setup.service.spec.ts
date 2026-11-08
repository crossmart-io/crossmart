import { BadRequestException } from '@nestjs/common';
import {
  type ChannelSession,
  ChannelType,
  type GoogleMerchantConnector,
  type GoogleMerchantSettings,
  GoogleTargetCountry,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import type { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import type { ConnectionAccountStore } from '../../services/connection-account.store.js';
import { GoogleMerchantSetupService } from './google-merchant-setup.service.js';

const ACTOR = Actor.user('user-1');
const TEMPLATE = 'https://acme.example/products/{handle}';
const SETTINGS: GoogleMerchantSettings = {
  channel: ChannelType.GoogleMerchant,
  accountId: '123456789',
  accountName: 'Acme Goods',
  homepageUri: 'https://acme.example',
  homepageClaimed: true,
  country: GoogleTargetCountry.US,
  currencyCode: 'USD',
  contentLanguage: 'en',
};

function connection(account: ChannelConnectionView['settings']['account'] = SETTINGS) {
  return {
    id: 'c1',
    channel: ChannelType.GoogleMerchant,
    displayName: 'Acme Goods',
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
  const google = { createDataSource: vi.fn().mockResolvedValue('ds-de') };
  const activity = new InMemoryActivityRecorder();
  const service = new GoogleMerchantSetupService(
    store as unknown as ConnectionAccountStore,
    sessions as unknown as ChannelSessionFactory,
    google as unknown as GoogleMerchantConnector,
    activity,
  );
  return { service, store, google, activity };
}

describe('GoogleMerchantSetupService', () => {
  it('creates the country’s data source and lists in its currency and language', async () => {
    const { service, store, google, activity } = setup();

    await service.saveListingSetup(
      'w1',
      'c1',
      { country: GoogleTargetCountry.DE, productUrlTemplate: TEMPLATE },
      ACTOR,
    );

    expect(google.createDataSource).toHaveBeenCalledWith({}, GoogleTargetCountry.DE);
    expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
      ...SETTINGS,
      country: GoogleTargetCountry.DE,
      currencyCode: 'EUR',
      contentLanguage: 'de',
      listingSetup: { country: 'DE', productUrlTemplate: TEMPLATE, dataSourceId: 'ds-de' },
      retiredDataSources: [],
    });
    expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelListingDefaultsUpdated);
  });

  it('keeps the data source when the country stays the same', async () => {
    const saved = {
      ...SETTINGS,
      listingSetup: {
        country: GoogleTargetCountry.US,
        productUrlTemplate: TEMPLATE,
        dataSourceId: 'ds-us',
      },
    };
    const { service, store, google } = setup(connection(saved));

    await service.saveListingSetup(
      'w1',
      'c1',
      { country: GoogleTargetCountry.US, productUrlTemplate: 'https://acme.example/p/{handle}' },
      ACTOR,
    );

    expect(google.createDataSource).not.toHaveBeenCalled();
    expect(store.saveAccount.mock.calls[0]?.[2]).toMatchObject({
      listingSetup: {
        dataSourceId: 'ds-us',
        productUrlTemplate: 'https://acme.example/p/{handle}',
      },
    });
  });

  it('keeps the old country’s data source, and reuses it when that country is picked again', async () => {
    const saved = {
      ...SETTINGS,
      listingSetup: {
        country: GoogleTargetCountry.US,
        productUrlTemplate: TEMPLATE,
        dataSourceId: 'ds-us',
      },
      retiredDataSources: [{ country: GoogleTargetCountry.DE, dataSourceId: 'ds-de-old' }],
    };
    const { service, store, google } = setup(connection(saved));

    await service.saveListingSetup(
      'w1',
      'c1',
      { country: GoogleTargetCountry.DE, productUrlTemplate: TEMPLATE },
      ACTOR,
    );

    expect(google.createDataSource).not.toHaveBeenCalled();
    expect(store.saveAccount.mock.calls[0]?.[2]).toMatchObject({
      listingSetup: { country: GoogleTargetCountry.DE, dataSourceId: 'ds-de-old' },
      retiredDataSources: [{ country: GoogleTargetCountry.US, dataSourceId: 'ds-us' }],
    });
  });

  it('refuses a connection that is not Google', async () => {
    const { service } = setup(connection({ channel: ChannelType.Ebay } as never));

    await expect(
      service.saveListingSetup(
        'w1',
        'c1',
        { country: GoogleTargetCountry.US, productUrlTemplate: TEMPLATE },
        ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
