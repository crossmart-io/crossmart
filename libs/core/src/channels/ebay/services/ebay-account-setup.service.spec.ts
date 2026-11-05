import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  type ChannelSession,
  ChannelError,
  ChannelErrorCode,
  ChannelType,
  EbayCondition,
  type EbayConnector,
  EbayMarketplaceId,
  type EbaySettings,
} from '@crossmart/connectors';
import { ChannelConnectionStatus } from '@crossmart/database';
import { Actor } from '../../../activity/entities/actor.js';
import { ActivityAction } from '../../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionView } from '../../entities/channel-connection-view.js';
import type { ChannelSessionFactory } from '../../services/channel-session.factory.js';
import type { ConnectionAccountStore } from '../../services/connection-account.store.js';
import type { EbayListingDefaultsInput } from '../entities/ebay-listing-defaults-input.js';
import { EbayAccountSetupService } from './ebay-account-setup.service.js';

const ACTOR = Actor.user('user-1');
const SETTINGS: EbaySettings = {
  channel: ChannelType.Ebay,
  marketplaceId: EbayMarketplaceId.UnitedStates,
  currencyCode: 'USD',
  username: 'demo_seller',
  userId: 'u1',
  businessPoliciesEnabled: true,
  policies: { fulfillment: [{ id: 'f1', name: 'Free' }], payment: [], return: [] },
};
const INPUT: EbayListingDefaultsInput = {
  fulfillmentPolicyId: 'f1',
  paymentPolicyId: null,
  returnPolicyId: null,
  condition: EbayCondition.UsedGood,
  location: { postalCode: '95125', country: 'US', city: null },
};

const CREATED = { fulfillment: 'f2', payment: 'p2', return: 'r2' };
const REFRESHED: EbaySettings = {
  ...SETTINGS,
  policies: {
    fulfillment: [
      ...SETTINGS.policies.fulfillment,
      { id: 'f2', name: 'Crossmart standard shipping' },
    ],
    payment: [{ id: 'p2', name: 'Crossmart payment' }],
    return: [{ id: 'r2', name: 'Crossmart 30-day returns' }],
  },
};

function connection(
  account: ChannelConnectionView['settings']['account'] = SETTINGS,
): ChannelConnectionView {
  return {
    id: 'c1',
    channel: ChannelType.Ebay,
    displayName: 'demo_seller · eBay US',
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
  const ebay = {
    saveShipFromLocation: vi.fn().mockResolvedValue('crossmart-default'),
    optInToBusinessPolicies: vi.fn().mockResolvedValue(undefined),
    createDefaultBusinessPolicies: vi.fn().mockResolvedValue(CREATED),
    describeAccount: vi.fn().mockResolvedValue({
      displayName: 'demo_seller · eBay US',
      settings: { ...SETTINGS, businessPoliciesEnabled: false },
    }),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new EbayAccountSetupService(
    store as unknown as ConnectionAccountStore,
    sessions as unknown as ChannelSessionFactory,
    ebay as unknown as EbayConnector,
    activity,
  );
  return { service, store, ebay, activity };
}

describe('EbayAccountSetupService', () => {
  it('saves the ship-from location on eBay, then the defaults with its key', async () => {
    const { service, store, ebay, activity } = setup();

    await service.saveListingDefaults('w1', 'c1', INPUT, ACTOR);

    expect(ebay.saveShipFromLocation).toHaveBeenCalledWith({}, INPUT.location);
    expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
      ...SETTINGS,
      listingDefaults: { ...INPUT, merchantLocationKey: 'crossmart-default' },
    });
    expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelListingDefaultsUpdated);
  });

  it('rejects a policy the account does not have, before calling eBay', async () => {
    const { service, ebay } = setup();

    await expect(
      service.saveListingDefaults('w1', 'c1', { ...INPUT, paymentPolicyId: 'p9' }, ACTOR),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ebay.saveShipFromLocation).not.toHaveBeenCalled();
  });

  it('refuses connections that are not eBay accounts', async () => {
    const { service } = setup(connection(null));

    await expect(service.refreshPolicies('w1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('turns an eBay rejection into an HTTP error the merchant can read', async () => {
    const { service, ebay } = setup();
    ebay.optInToBusinessPolicies.mockRejectedValue(
      new ChannelError(ChannelType.Ebay, ChannelErrorCode.CredentialsRejected, 'Connect again'),
    );

    await expect(service.optInToBusinessPolicies('w1', 'c1', ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('reads policies again and keeps the listing defaults', async () => {
    const defaults = { ...INPUT, merchantLocationKey: 'crossmart-default' };
    const account: EbaySettings = { ...SETTINGS, listingDefaults: defaults };
    const { service, store, activity } = setup(connection(account));

    await service.optInToBusinessPolicies('w1', 'c1', ACTOR);

    expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
      ...SETTINGS,
      businessPoliciesEnabled: false,
      listingDefaults: defaults,
    });
    expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelPoliciesOptedIn);
  });

  describe('createDefaultPolicies', () => {
    it('creates the policies in the marketplace currency and chooses them, keeping the rest', async () => {
      const defaults = { ...INPUT, merchantLocationKey: 'crossmart-default' };
      const account: EbaySettings = { ...SETTINGS, listingDefaults: defaults };
      const { service, store, ebay, activity } = setup(connection(account));
      ebay.describeAccount.mockResolvedValue({ displayName: 'x', settings: REFRESHED });

      await service.createDefaultPolicies('w1', 'c1', ACTOR);

      expect(ebay.createDefaultBusinessPolicies).toHaveBeenCalledWith(
        {},
        { currencyCode: 'USD', businessPoliciesEnabled: true },
      );
      expect(store.saveAccount).toHaveBeenCalledWith('w1', expect.anything(), {
        ...REFRESHED,
        listingDefaults: {
          ...defaults,
          fulfillmentPolicyId: 'f2',
          paymentPolicyId: 'p2',
          returnPolicyId: 'r2',
        },
      });
      expect(activity.entries[0]?.action).toBe(ActivityAction.ChannelDefaultPoliciesCreated);
    });

    it('asks to opt in an account whose policies are off, and starts its defaults', async () => {
      const policiesOff: EbaySettings = { ...SETTINGS, businessPoliciesEnabled: false };
      const { service, store, ebay } = setup(connection(policiesOff));
      ebay.describeAccount.mockResolvedValue({ displayName: 'x', settings: REFRESHED });

      await service.createDefaultPolicies('w1', 'c1', ACTOR);

      expect(ebay.createDefaultBusinessPolicies).toHaveBeenCalledWith(
        {},
        { currencyCode: 'USD', businessPoliciesEnabled: false },
      );
      expect(store.saveAccount.mock.calls[0]?.[2]).toMatchObject({
        listingDefaults: {
          fulfillmentPolicyId: 'f2',
          condition: EbayCondition.New,
          location: null,
        },
      });
    });

    it('answers 422 with eBay’s reason and records nothing when eBay refuses', async () => {
      const { service, ebay, store, activity } = setup();
      ebay.createDefaultBusinessPolicies.mockRejectedValue(
        new ChannelError(ChannelType.Ebay, ChannelErrorCode.RequestRejected, 'No service'),
      );

      await expect(service.createDefaultPolicies('w1', 'c1', ACTOR)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(store.saveAccount).not.toHaveBeenCalled();
      expect(activity.entries).toHaveLength(0);
    });
  });
});
